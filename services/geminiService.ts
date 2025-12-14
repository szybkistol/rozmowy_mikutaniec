
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { Conversation, Sentiment, TranscriptSegment, ActionItem } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

const ANALYSIS_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-flash";

// Schema for structured analysis output including transcript segments and action items
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "Krótki, profesjonalny tytuł rozmowy." },
    shortDescription: { type: Type.STRING, description: "Krótkie streszczenie rozmowy (2-3 zdania), o co w niej chodziło." },
    detailedSummary: { type: Type.STRING, description: "Pełny raport z rozmowy w formacie Markdown (Nagłówki, listy), wygenerowany ściśle według instrukcji w prompcie." },
    sentiment: { 
      type: Type.STRING, 
      enum: ["Dobrze", "Neutralnie", "Źle"],
      description: "Ogólny sentyment rozmowy z perspektywy wyniku biznesowego." 
    },
    actionItems: {
      type: Type.ARRAY,
      description: "Lista konkretnych zadań do wykonania lub spotkań wynikających z rozmowy.",
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["task", "event"], description: "Czy to zadanie do zrobienia czy spotkanie/wydarzenie." },
          content: { type: Type.STRING, description: "Treść zadania lub nazwa spotkania." },
          date: { type: Type.STRING, description: "Data lub termin jeśli padł w rozmowie (np. 'Jutro 14:00', '2024-10-12'), w przeciwnym razie puste." }
        },
        required: ["type", "content"]
      }
    },
    segments: {
      type: Type.ARRAY,
      description: "Pełna transkrypcja rozmowy podzielona na segmenty wypowiedzi.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER, description: "Kolejny numer segmentu, zaczynając od 1." },
          speaker: { type: Type.STRING, description: "Nazwa lub rola mówcy (np. Klient, Sprzedawca, Jan)." },
          text: { type: Type.STRING, description: "Treść wypowiedzi." },
          timestamp: { type: Type.STRING, description: "Czas rozpoczęcia wypowiedzi w formacie MM:SS." }
        },
        required: ["id", "speaker", "text", "timestamp"]
      }
    }
  },
  required: ["title", "shortDescription", "detailedSummary", "sentiment", "segments", "actionItems"],
  // Ensure segments are last so if truncation occurs, we save metadata
  propertyOrdering: ["title", "shortDescription", "detailedSummary", "sentiment", "actionItems", "segments"]
};

// Helper to attempt repairing truncated JSON
const repairTruncatedJson = (jsonStr: string): string => {
  let fixed = jsonStr.trim();
  
  // 1. Remove trailing comma if exists (common before truncation)
  if (fixed.endsWith(',')) {
    fixed = fixed.slice(0, -1);
  }

  // 2. Intelligent tail removal for broken keys/values
  // Example: ... "someKey": "someVal -> remove the incomplete part
  // Strategy: Find the last valid structural character
  
  // If it ends with a quote, it might be an unclosed key or value.
  // We need to be careful. A safer bet for truncated JSON from LLMs 
  // is to strip back to the last known "safe" delimiter if the end looks garbage.
  
  // Count quotes to see if we are inside a string
  let quoteCount = 0;
  let escape = false;
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    if (char === '\\' && !escape) {
      escape = true;
      continue;
    }
    if (char === '"' && !escape) {
      quoteCount++;
    }
    escape = false;
  }
  
  const inString = quoteCount % 2 !== 0;

  if (inString) {
    // We are inside a string. To be safe, we should probably remove this entire string 
    // and its key if it's a value, or just the key if it's a key.
    // However, simplest repair is to close it and see if we can balance.
    // BUT, usually LLM cuts off in the middle of a sentence.
    // Better approach: Find the last double quote.
    const lastQuoteIndex = fixed.lastIndexOf('"');
    if (lastQuoteIndex > 0) {
       // Check what was before the string.
       // If we cut here, we might leave a dangling key or colon.
       // Let's trying closing it first.
       fixed += '"';
    }
  } else {
    // We are not in a string, but we might be in the middle of a number, boolean, or null,
    // or just after a key with no value.
    
    // If ends with ':', remove it and the preceding key
    if (fixed.trim().endsWith(':')) {
       fixed = fixed.substring(0, fixed.lastIndexOf(':'));
       // Now we might have "key" at the end. Remove it.
       const lastQuote = fixed.lastIndexOf('"');
       if (lastQuote !== -1) {
          const secondLastQuote = fixed.lastIndexOf('"', lastQuote - 1);
          if (secondLastQuote !== -1) {
             fixed = fixed.substring(0, secondLastQuote);
          }
       }
    }
  }

  // Clean up any trailing commas again after modifications
  fixed = fixed.trim();
  if (fixed.endsWith(',')) fixed = fixed.slice(0, -1);

  // 3. Balance braces and brackets
  const stack = [];
  let inStr = false;
  let esc = false;
  
  // Re-scan to build stack of brackets
  for (let i = 0; i < fixed.length; i++) {
    const char = fixed[i];
    if (char === '\\' && !esc) {
      esc = true;
      continue;
    }
    if (char === '"' && !esc) {
      inStr = !inStr;
    }
    esc = false;
    
    if (!inStr) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }
  
  // Append missing closing brackets in reverse order
  while (stack.length > 0) {
    fixed += stack.pop();
  }
  
  return fixed;
}

export const analyzeAudioConversation = async (base64Data: string, mimeType: string): Promise<Partial<Conversation>> => {
  if (!apiKey) throw new Error("API Key is missing");

  // CRITICAL UPDATE: Explicit instruction to transcript fully without summarization
  // AND use the user's specific prompt for the 'detailedSummary' field.
  const prompt = `
    Przeanalizuj załączony plik audio z rozmową.
    Twoim zadaniem jest wygenerowanie kompletnego raportu w formacie JSON.
    
    WYMAGANIA:
    1. Transkrypcja (segments) musi być PEŁNA i DOKŁADNA, słowo w słowo, obejmująca 100% czasu trwania nagrania. NIE POMIJAJ ŻADNYCH FRAGMENTÓW, nawet jeśli rozmowa jest długa. Nie streszczaj transkrypcji - od tego są inne pola.
    
    2. Wykryć wszelkie zadania (taski) i plany spotkań (eventy).
    
    3. Określić sentyment.

    4. RAPORT (detailedSummary):
    Wygeneruj zawartość pola 'detailedSummary' w formacie Markdown, STOSUJĄC SIĘ DO PONIŻSZYCH INSTRUKCJI:
    
    # Rola
    Jesteś profesjonalnym asystentem specjalizującym się w tworzeniu szczegółowych raportów z rozmów biznesowych.

    # Zadanie
    ## Główne zadanie
    Twoim głównym zadaniem jest przeanalizowanie oraz podsumowanie przeprowadzonej rozmowy biznesowej według podanych zasad oraz przedstawienie raportu w ściśle określonym formacie. 
    ## Analiza
    Przeanalizuj dogłębnie przedstawioną rozmowę, wyciągnij z niej najważniejsze sentencje:
    - Osoby biorące w niej udział (imiona oraz role jakie pełnią)
    - Główny cel rozmowy
    - Najważniejsze wnioski z rozmowy
    - Uzgodnione zadania do zrealizowania (do kogo zostały przypisane?)
    ## Struktura raportu
    Stwórz raport z rozmowy z następującymi sekcjami:
    1. Podsumowanie - krótkie podsumowanie rozmowy.
    Przedstaw zwięzłe podsumowanie zawierające cel spotkania, najważniejsze podjęte decyzje oraz kluczowe zadania do wykonania. 
    2. Uczestnicy rozmowy - lista uczestników rozmowy.
    Wymień imiona, pseudonimy lub inne jednoznaczne identyfikatory wszystkich osób biorących udział w rozmowie.
    3. Przebieg rozmowy - chronologiczna szczegółowa lista podjętych wątków w rozmowie.
    Przedstaw wszystkie ważne wątki, które pojawiły się w rozmowie w kolejności chronologicznej.
    4. Ustalenia i zadania - lista wszystkich podjętych decyzji w trakcie rozmowy.
    Wymień wszystkie ustalenia oraz zadania jakie padły podczas rozmowy.
    Zachowaj pełną szczegółowość.
    Nie pomijaj żadnego wątku, każdy wątek ma być opisany w pełni szczegółowo.
    ## Zasady
    ### Styl i ton
    - Formalny, profesjonalny język
    - Przejrzysta struktura
    - Informacje przedstawione w sposób łatwy do przyswojenia
    - Nie podawaj timestampów
    - Zawrzyj wszystkie możliwe szczegóły
    - Nie pomijaj ważnych wątków/informacji
    - Wypisz wszystkie wątki w najdrobniejszych szczegółach
    - Wypisz wszystkie ustalenia/zadania w najdrobniejszych szczegółach
    ### Struktura - zawsze trzymaj się przedstawionego przykładowego schematu:
    Raport z rozmowy {krótki tytuł}

    1. Podsumowanie
    {Opis rozmowy w 3-4 zdaniach}
    2. Uczestnicy rozmowy
    - {Uczestnik 1}
    - {Uczestnik 2}
    3. Przebieg rozmowy (wszystkie wątki w szczegółach)
    - {Wątek 1} - Szczegółowy opis
    - {Wątek 2} - Szczegółowy opis
    - {Wątek 3} - Szczegółowy opis
    - {Wątek 4} - Szczegółowy opis
    - {Wątek 5} - Szczegółowy opis
    4. Ustalenia i zadania (wszystkie ustalenia/zadania w szczegółach)
    - {Ustalenie/zadanie 1} - Szczegółowy opis
    - {Ustalenie/zadanie 2} - Szczegółowy opis
    - {Ustalenie/zadanie 3} - Szczegółowy opis
    - {Ustalenie/zadanie 4} - Szczegółowy opis
    - {Ustalenie/zadanie 5} - Szczegółowy opis
    # Kontekst
    Rozmowa przeprowadzona była w stylu czysto biznesowym, chce przedstawić raport z rozmowy swoim zwierzchnikom.
    Raport musi wyglądać jak milion dolarów przelew.
    Raport musi być bardzo szczegółowy, nie pomijaj żadnych faktów.

    Wygeneruj odpowiedź wyłącznie w formacie JSON zgodnym ze schematem.
  `;

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Low temperature for more accurate transcription
        maxOutputTokens: 8192, // Maximize output token limit
        safetySettings: [
           { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
           { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
           { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
           { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      }
    });

    const rawText = response.text || "{}";
    
    // Validation: Check if the response was blocked or empty
    if (response.candidates && response.candidates[0].finishReason === 'SAFETY') {
        throw new Error("Analiza zablokowana przez filtry bezpieczeństwa.");
    }
    if (rawText.length < 10 && rawText.trim() === "{}") {
        throw new Error("Model zwrócił pustą odpowiedź.");
    }

    let result;

    try {
      result = JSON.parse(rawText);
    } catch (e) {
      console.warn("JSON parse failed, attempting repair of truncated JSON...", e);
      try {
        const fixedText = repairTruncatedJson(rawText);
        result = JSON.parse(fixedText);
        console.log("JSON successfully repaired.");
      } catch (repairError) {
        console.error("Critical error: Could not repair JSON", repairError);
        throw new Error("Analiza nieudana: Odpowiedź modelu była zbyt długa lub uszkodzona.");
      }
    }
    
    // Map action items to include IDs and status
    const mappedActionItems: ActionItem[] = (result.actionItems || []).map((item: any, index: number) => ({
      id: `action_${Date.now()}_${index}`,
      type: item.type,
      content: item.content,
      date: item.date,
      status: 'pending'
    }));
    
    return {
      title: result.title || "Bez tytułu",
      shortDescription: result.shortDescription || "Brak opisu",
      detailedSummary: result.detailedSummary || "Brak podsumowania",
      sentiment: (result.sentiment as Sentiment) || Sentiment.NEUTRAL,
      segments: result.segments || [],
      actionItems: mappedActionItems
    };

  } catch (error) {
    console.error("Error analyzing conversation:", error);
    throw error;
  }
};

export const chatWithTranscript = async (
  history: { role: string; content: string }[],
  currentMessage: string,
  segments: TranscriptSegment[]
): Promise<{ text: string; citations: number[] }> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Prepare context with indexed lines for citation
  const context = segments.map(s => `[ID:${s.id}] ${s.speaker} (${s.timestamp}): ${s.text}`).join('\n');

  const systemInstruction = `
    Jesteś asystentem AI analizującym konkretną rozmowę.
    Masz dostęp do transkrypcji, w której każda wypowiedź ma unikalne [ID].
    
    Twoje zadanie:
    1. Odpowiadaj na pytania użytkownika WYŁĄCZNIE na podstawie dostarczonej transkrypcji.
    2. Styl odpowiedzi:
       - Używaj TYLKO czystego tekstu (plain text).
       - NIE UŻYWAJ żadnego formatowania Markdown (pogrubień, kursywy, list, nagłówków).
       - Pisz płynnie i naturalnie.
       - NIE WSPOMINAJ o "segmentach", "transkrypcji" czy "numerach ID" w treści samej wiadomości. Np. zamiast "W segmencie 4 klient powiedział..." napisz "Klient powiedział...".
    3. Źródła:
       - Na samym końcu odpowiedzi (i tylko tam) dodaj numery ID segmentów, które potwierdzają Twoją odpowiedź.
       - Format techniczny (niewidoczny dla użytkownika): ||CITATIONS:[1, 2, 5]||.
    4. Jeśli w tekście nie ma informacji, powiedz to wprost.
    5. Odpowiadaj w języku polskim.
    
    TRANSKRYPCJA:
    ${context}
  `;

  const chatHistory = history.map(h => ({
    role: h.role,
    parts: [{ text: h.content }]
  }));

  try {
    const chat = ai.chats.create({
      model: CHAT_MODEL,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({ message: currentMessage });
    const rawText = result.text || "";

    // Extract citations
    const citationRegex = /\|\|CITATIONS:\[(.*?)\]\|\|/;
    const match = rawText.match(citationRegex);
    
    let citations: number[] = [];
    let cleanText = rawText;

    if (match) {
      try {
        const ids = match[1].split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        citations = ids;
        cleanText = rawText.replace(match[0], '').trim();
      } catch (e) {
        console.warn("Failed to parse citations", e);
      }
    }

    return {
      text: cleanText,
      citations
    };

  } catch (error) {
    console.error("Error in chat:", error);
    return { text: "Przepraszam, wystąpił błąd podczas przetwarzania zapytania.", citations: [] };
  }
};
