import React, { useState } from 'react';
import { analyzeAudioConversation } from '../services/geminiService';
import { Conversation } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onSave: (conversation: Conversation) => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (selectedFile.size > 3 * 1024 * 1024) {
        setError("Ostrzeżenie: Plik jest duży (>3MB). Może nie zostać zapisany w pamięci przeglądarki, ale analiza zostanie wykonana.");
      } else {
        setError(null);
      }
    }
  };

  const getMimeType = (file: File): string => {
    if (file.type && file.type !== '' && file.type !== 'application/octet-stream') {
      return file.type;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'amr': return 'audio/amr';
      case '3gp': return 'audio/3gpp';
      case 'mp3': return 'audio/mp3';
      case 'wav': return 'audio/wav';
      case 'm4a': return 'audio/mp4';
      case 'aac': return 'audio/aac';
      case 'ogg': return 'audio/ogg';
      case 'flac': return 'audio/flac';
      case 'mp4': return 'audio/mp4';
      default: return 'audio/mp3';
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    if (file.size <= 3 * 1024 * 1024) setError(null);

    try {
      const fullDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

      const base64Data = fullDataUrl.split(',')[1];
      const mimeType = getMimeType(file);
      const metadata = await analyzeAudioConversation(base64Data, mimeType);
      
      if (!metadata.title || !metadata.sentiment || !metadata.segments) {
        throw new Error("Failed to generate complete metadata and transcript");
      }

      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        date: new Date().toISOString(),
        clientId: null,
        title: metadata.title,
        shortDescription: metadata.shortDescription || "Brak opisu",
        detailedSummary: metadata.detailedSummary || "Brak podsumowania",
        sentiment: metadata.sentiment,
        segments: metadata.segments,
        actionItems: metadata.actionItems || [],
        audioUrl: fullDataUrl
      };

      onSave(newConversation);
      onClose();

    } catch (err: any) {
      console.error(err);
      let msg = "Wystąpił błąd podczas analizy pliku.";
      if (err.message && err.message.includes("400")) {
         msg = "Błąd API (400). Prawdopodobnie format pliku jest uszkodzony lub nieobsługiwany bezpośrednio przez model.";
      }
      setError(msg + " Spróbuj użyć popularnego formatu (MP3, WAV, M4A).");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-xl font-bold text-gray-800">Prześlij Rozmowę</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-8 flex-1 flex flex-col items-center justify-center">
          <div className="w-full">
            <label 
              htmlFor="audio-upload"
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-blue-400'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <div className="w-12 h-12 mb-3 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                       <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                       </svg>
                    </div>
                    <p className="mb-1 text-sm text-blue-800 font-bold px-4 text-center break-all">{file.name}</p>
                    <p className="text-xs text-blue-500 font-medium">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {getMimeType(file)}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    </div>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold text-blue-600">Kliknij, aby wybrać plik</span> lub upuść tutaj</p>
                    <p className="text-xs text-gray-400">MP3, M4A, WAV, AMR, AAC (max 20MB)</p>
                  </>
                )}
              </div>
              <input 
                id="audio-upload" 
                type="file" 
                accept="audio/*,.amr,.3gp,.m4a,.mp3,.wav,.ogg,.aac" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isAnalyzing}
              />
            </label>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
              System automatycznie dokona transkrypcji, rozpozna mówców i przeanalizuje treść rozmowy.
              <br/>Zalecane pliki do 5MB (dla wersji demo).
            </p>
          </div>

          {error && (
            <div className="mt-4 w-full p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 text-center animate-in fade-in slide-in-from-top-2">
              {error}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            disabled={isAnalyzing}
          >
            Anuluj
          </button>
          <button 
            onClick={handleAnalyze}
            disabled={!file || isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-70 disabled:shadow-none flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analizowanie...
              </>
            ) : (
              'Analizuj Rozmowę'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;