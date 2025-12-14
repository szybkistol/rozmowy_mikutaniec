
import React, { useState, useRef, useEffect } from 'react';
import { Conversation, Client, ChatMessage, TranscriptSegment, Sentiment, ActionItem } from '../types';
import { chatWithTranscript } from '../services/geminiService';

interface ConversationDetailProps {
  conversation: Conversation;
  clients: Client[];
  onUpdateClient: (conversationId: string, clientId: string) => void;
  onUpdateConversation: (conversation: Conversation) => void;
  onBack: () => void;
  onDelete: () => void;
}

const renderMarkdown = (text: string) => {
  if (!text) return <p className="text-gray-500 italic">Brak treści raportu.</p>;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-5 mb-4 space-y-1 text-gray-700">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  const parseInline = (line: string): React.ReactNode[] => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      elements.push(<h1 key={index} className="text-2xl font-bold text-gray-900 mb-6 mt-2 pb-2 border-b border-gray-100">{parseInline(trimmed.slice(2))}</h1>);
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(<h2 key={index} className="text-xl font-bold text-gray-800 mb-3 mt-6">{parseInline(trimmed.slice(3))}</h2>);
    } else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<h3 key={index} className="text-lg font-bold text-gray-800 mb-2 mt-4">{parseInline(trimmed.slice(4))}</h3>);
    } 
    else if (/^\d+\.\s/.test(trimmed)) {
       flushList();
       elements.push(<h3 key={index} className="text-lg font-bold text-blue-800 mb-3 mt-6 uppercase tracking-wide">{parseInline(trimmed)}</h3>);
    }
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(<li key={index}>{parseInline(trimmed.slice(2))}</li>);
    } 
    else {
      flushList();
      elements.push(<p key={index} className="mb-3 text-gray-700 leading-relaxed">{parseInline(trimmed)}</p>);
    }
  });

  flushList();
  return elements;
};

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation, clients, onUpdateClient, onUpdateConversation, onBack, onDelete }) => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'summary' | 'transcript'>('details');
  const [highlightedSegments, setHighlightedSegments] = useState<number[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const transcriptRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput
    };

    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await chatWithTranscript(
        chatHistory.map(m => ({ role: m.role, content: m.content })),
        userMsg.content,
        conversation.segments
      );

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: response.text,
        citations: response.citations
      };

      setChatHistory(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCitationClick = (citationIds: number[] | undefined) => {
    if (!citationIds || citationIds.length === 0) return;
    setHighlightedSegments(citationIds);
    setActiveTab('transcript');
    const firstId = citationIds[0];
    const el = transcriptRefs.current[firstId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleActionItem = (id: string, action: 'accept' | 'reject') => {
    const updatedItems = conversation.actionItems.map(item => {
      if (item.id === id) {
        return { ...item, status: action === 'accept' ? 'accepted' : 'rejected' };
      }
      return item;
    }).filter(item => item.status !== 'rejected') as ActionItem[];

    const updatedConversation = {
      ...conversation,
      actionItems: updatedItems
    };
    onUpdateConversation(updatedConversation);
  };

  const clearHighlight = () => setHighlightedSegments([]);

  const tabClass = (tab: typeof activeTab) => 
    `flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
      activeTab === tab 
        ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900 leading-tight line-clamp-1">{conversation.title}</h2>
            <div className="flex items-center gap-3 text-sm mt-1">
              <span className="text-gray-500">{new Date(conversation.date).toLocaleString()}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                conversation.sentiment === Sentiment.POSITIVE ? 'bg-green-50 text-green-700 border-green-200' :
                conversation.sentiment === Sentiment.NEGATIVE ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {conversation.sentiment}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:flex-none">
            <select 
              className="w-full md:w-auto border border-gray-300 rounded-md text-sm py-1.5 pl-2 pr-8 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
              value={conversation.clientId || ''}
              onChange={(e) => onUpdateClient(conversation.id, e.target.value)}
            >
              <option value="">-- Nieprzypisany --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          
          <div className="w-px h-6 bg-gray-300 mx-2 hidden md:block"></div>

          <button
            onClick={() => {
               if (onDelete) onDelete();
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Usuń tę rozmowę"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel */}
        <div className="w-full lg:w-7/12 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 h-1/2 lg:h-full">
          <div className="flex border-b border-gray-200 bg-white shrink-0">
            <button className={tabClass('details')} onClick={() => setActiveTab('details')}>
              Szczegóły
            </button>
            <button className={tabClass('transcript')} onClick={() => setActiveTab('transcript')}>
              Transkrypcja
            </button>
            <button className={tabClass('summary')} onClick={() => setActiveTab('summary')}>
              Raport
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 p-4 md:p-6 relative">
            
            {activeTab === 'details' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Audio Player */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                     <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                      Nagranie rozmowy
                    </h3>
                    {conversation.audioUrl ? (
                      <audio controls src={conversation.audioUrl} className="w-full h-10 rounded-lg focus:outline-none bg-gray-50" />
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center text-sm text-gray-500 italic">
                        Brak nagrania audio dla tej rozmowy.
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                      O czym była rozmowa?
                    </h3>
                    <p className="text-gray-800 leading-relaxed text-base">{conversation.shortDescription}</p>
                  </div>

                  {/* Action Items */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2 px-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                      Wykryte działania i spotkania
                    </h3>
                    
                    {conversation.actionItems && conversation.actionItems.length > 0 ? (
                      <div className="grid gap-3">
                        {conversation.actionItems.map(item => (
                          <div 
                            key={item.id} 
                            className={`flex items-start gap-4 bg-white p-4 rounded-xl border transition-all ${
                              item.status === 'accepted' 
                                ? 'border-green-200 bg-green-50 shadow-none opacity-80' 
                                : 'border-gray-200 shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className={`mt-1 p-2 rounded-lg shrink-0 ${
                              item.type === 'event' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {item.type === 'event' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h4 className={`font-medium ${item.status === 'accepted' ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                                {item.content}
                              </h4>
                              {item.date && (
                                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                  {item.date}
                                </div>
                              )}
                              {item.status === 'accepted' && (
                                <span className="text-xs text-green-600 font-semibold mt-1 block">Dodano do Google {item.type === 'event' ? 'Calendar' : 'Tasks'}</span>
                              )}
                            </div>

                            {item.status !== 'accepted' && (
                              <div className="flex flex-col gap-2 border-l border-gray-100 pl-3">
                                <button 
                                  onClick={() => handleActionItem(item.id, 'accept')}
                                  className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                                  title="Akceptuj i dodaj"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                </button>
                                <button 
                                  onClick={() => handleActionItem(item.id, 'reject')}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                  title="Odrzuć i usuń"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
                        Brak wykrytych zadań lub spotkań.
                      </div>
                    )}
                  </div>
               </div>
            )}

            {activeTab === 'transcript' && (
              <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200" onClick={clearHighlight}>
                {conversation.segments.map((seg) => {
                  const isHighlighted = highlightedSegments.includes(seg.id);
                  return (
                    <div 
                      key={seg.id} 
                      ref={el => { transcriptRefs.current[seg.id] = el }}
                      className={`flex gap-4 p-3 rounded-lg transition-colors duration-500 ${isHighlighted ? 'bg-yellow-100 ring-1 ring-yellow-300' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-12 shrink-0 text-xs text-gray-400 pt-1 font-mono text-right">{seg.timestamp}</div>
                      <div>
                        <div className="text-xs font-bold text-gray-600 mb-0.5">{seg.speaker}</div>
                        <p className="text-gray-800 leading-relaxed text-sm">{seg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'summary' && (
              <div className="animate-in fade-in duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-bold text-gray-900 text-lg m-0">Dokumentacja powykonawcza</h3>
                </div>
                
                <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-gray-800 leading-relaxed text-base">
                  {renderMarkdown(conversation.detailedSummary)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="w-full lg:w-5/12 flex flex-col bg-gray-50 h-1/2 lg:h-full border-t lg:border-t-0">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Asystent AI
            </h3>
            <p className="text-xs text-gray-500">Zadawaj pytania dotyczące tej rozmowy. AI wskaże źródła.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {chatHistory.length === 0 && (
              <div className="text-center mt-10 p-6 bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">Zapytaj np.: "Jaka była ostateczna cena?" lub "Na co narzekał klient?"</p>
              </div>
            )}
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div 
                  className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'model' && msg.citations && msg.citations.length > 0 && (
                  <button 
                    onClick={() => handleCitationClick(msg.citations)}
                    className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors bg-blue-50 px-2 py-1 rounded-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Źródło: segmenty {msg.citations.join(', ')}
                  </button>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1 ml-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <div className="relative">
              <input
                type="text"
                className="w-full border border-gray-300 bg-white text-gray-900 rounded-full py-3 pl-4 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm shadow-sm"
                placeholder="Zapytaj o treść rozmowy..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isTyping}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isTyping}
                className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationDetail;
