
import { Client, Conversation, Sentiment, TranscriptSegment } from "../types";

const CLIENTS_KEY = 'convo_clients';
const CONVOS_KEY = 'convo_data';

// Mock Initial Data
const INITIAL_CLIENTS: Client[] = [
  { id: 'c1', name: 'Jan Kowalski', company: 'TechSolutions Sp. z o.o.', email: 'jan@techsolutions.pl', phone: '+48 500 123 456', notes: 'Kluczowy klient, branża IT.' },
  { id: 'c2', name: 'Anna Nowak', company: 'Marketing Guru', email: 'anna@marketing.guru', phone: '+48 600 987 654', notes: 'Zainteresowana nowymi funkcjami.' },
];

const MOCK_TRANSCRIPT: TranscriptSegment[] = [
  { id: 1, speaker: 'Sprzedawca', text: 'Dzień dobry, z tej strony Adam z aplikacji rozmowy. Czy rozmawiam z Panem Janem?', timestamp: '00:05' },
  { id: 2, speaker: 'Klient', text: 'Tak, dzień dobry. Słucham Pana.', timestamp: '00:10' },
  { id: 3, speaker: 'Sprzedawca', text: 'Chciałbym porozmawiać o odnowieniu naszej umowy na przyszły rok. Czy ma Pan chwilę?', timestamp: '00:15' },
  { id: 4, speaker: 'Klient', text: 'W zasadzie tak, ale mamy pewne zastrzeżenia co do ceny.', timestamp: '00:20' },
  { id: 5, speaker: 'Sprzedawca', text: 'Rozumiem. Czy cena jest jedyną przeszkodą? Możemy zaproponować 10% rabatu przy płatności z góry.', timestamp: '00:35' },
  { id: 6, speaker: 'Klient', text: 'Hmm, 10% brzmi rozsądnie. A co ze wsparciem technicznym w weekendy?', timestamp: '00:45' },
  { id: 7, speaker: 'Sprzedawca', text: 'W pakiecie Premium, który Pan posiada, wsparcie jest 24/7.', timestamp: '00:55' },
  { id: 8, speaker: 'Klient', text: 'Dobrze, w takim razie możemy przedłużyć umowę.', timestamp: '01:05' },
];

const INITIAL_CONVOS: Conversation[] = [
  {
    id: 'conv1',
    title: 'Negocjacje przedłużenia umowy',
    date: new Date().toISOString(),
    clientId: 'c1',
    shortDescription: 'Rozmowa dotyczyła negocjacji warunków przedłużenia umowy na kolejny rok. Klient miał wątpliwości cenowe, ale zaakceptował ofertę po otrzymaniu 10% rabatu.',
    detailedSummary: 'Klient wyraził obawy dotyczące ceny. Zaproponowano 10% rabatu. Potwierdzono dostępność wsparcia 24/7. Klient zgodził się na przedłużenie.',
    sentiment: Sentiment.POSITIVE,
    segments: MOCK_TRANSCRIPT,
    actionItems: [
      { id: 'a1', type: 'task', content: 'Przygotować aneks do umowy z rabatem 10%', status: 'pending' },
      { id: 'a2', type: 'event', content: 'Spotkanie finalizujące', date: 'Jutro 10:00', status: 'pending' }
    ]
  }
];

export const getClients = (): Client[] => {
  const data = localStorage.getItem(CLIENTS_KEY);
  if (!data) {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(INITIAL_CLIENTS));
    return INITIAL_CLIENTS;
  }
  return JSON.parse(data);
};

export const saveClient = (client: Client) => {
  const clients = getClients();
  const updated = [...clients, client];
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(updated));
};

export const updateClient = (client: Client) => {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === client.id);
  if (index !== -1) {
    clients[index] = client;
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  }
};

export const deleteClient = (id: string) => {
  const clients = getClients();
  const updated = clients.filter(c => c.id !== id);
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(updated));
};

export const getConversations = (): Conversation[] => {
  const data = localStorage.getItem(CONVOS_KEY);
  if (!data) {
    localStorage.setItem(CONVOS_KEY, JSON.stringify(INITIAL_CONVOS));
    return INITIAL_CONVOS;
  }
  return JSON.parse(data);
};

export const saveConversation = (convo: Conversation) => {
  const convos = getConversations();
  // Check if exists update, else add
  const idx = convos.findIndex(c => c.id === convo.id);
  let updated;
  if (idx >= 0) {
    updated = [...convos];
    updated[idx] = convo;
  } else {
    updated = [convo, ...convos];
  }
  
  try {
    localStorage.setItem(CONVOS_KEY, JSON.stringify(updated));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn("LocalStorage quota exceeded. Attempting to save without audio data.");
      
      // Fallback: Remove audioUrl from the problematic conversation to save space
      if (convo.audioUrl) {
        const convoWithoutAudio = { ...convo };
        delete convoWithoutAudio.audioUrl;
        
        if (idx >= 0) {
           updated[idx] = convoWithoutAudio;
        } else {
           updated[0] = convoWithoutAudio;
        }
        
        try {
          localStorage.setItem(CONVOS_KEY, JSON.stringify(updated));
          alert("Uwaga: Rozmowa została zapisana, ale nagranie audio zostało usunięte z powodu braku miejsca w pamięci przeglądarki.");
        } catch (e2) {
          alert("Błąd krytyczny: Nie można zapisać rozmowy nawet bez audio (brak pamięci).");
        }
      } else {
        alert("Błąd zapisu: Brak miejsca w pamięci przeglądarki.");
      }
    } else {
      console.error("Storage error:", e);
    }
  }
};

export const deleteConversation = (id: string) => {
  const convos = getConversations();
  const updated = convos.filter(c => c.id !== id);
  localStorage.setItem(CONVOS_KEY, JSON.stringify(updated));
};
