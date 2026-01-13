import React, { useState, useRef, useEffect } from 'react';
import { Course, ChatMessage } from '../types';
import { getSmartRecommendations } from '../services/geminiService';
import { Sparkles, Send, X, Bot, Lock } from 'lucide-react';

interface AIAssistantProps {
  courses: Course[];
}

// Simple Markdown Formatter Component
const MarkdownText: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  // Split by newlines to handle blocks
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const parseInline = (line: string) => {
    // Handle Bold **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={isUser ? 'font-black' : 'font-bold text-slate-900'}>{part.slice(2, -2)}</strong>;
      }
      // Handle Links [text](url)
      const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
         return (
            <a 
                key={i} 
                href={linkMatch[2]} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={`underline ${isUser ? 'text-white' : 'text-blue-600 hover:text-blue-800'}`}
            >
                {linkMatch[1]}
            </a>
         );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Handle Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.substring(2));
    } else {
      // Flush List Buffer if needed
      if (listBuffer.length > 0) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc ml-5 mb-3 space-y-1">
            {listBuffer.map((item, liIndex) => (
              <li key={liIndex} className="pl-1">{parseInline(item)}</li>
            ))}
          </ul>
        );
        listBuffer = [];
      }

      // Handle Headers
      if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={index} className="font-bold text-sm mt-4 mb-1 uppercase tracking-wider opacity-80">{parseInline(trimmed.substring(4))}</h3>);
      } 
      // Handle Paragraphs
      else if (trimmed !== '') {
        elements.push(<p key={index} className="mb-2 last:mb-0 leading-relaxed">{parseInline(trimmed)}</p>);
      }
    }
  });

  // Flush remaining list
  if (listBuffer.length > 0) {
    elements.push(
      <ul key="list-end" className="list-disc ml-5 mb-3 space-y-1">
        {listBuffer.map((item, liIndex) => (
          <li key={liIndex} className="pl-1">{parseInline(item)}</li>
        ))}
      </ul>
    );
  }

  return <>{elements}</>;
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ courses }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Check veilig of de key er is (via de define in vite.config.ts)
  const hasApiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY && process.env.API_KEY !== "undefined" && process.env.API_KEY !== "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message based on config status
  useEffect(() => {
    if (messages.length === 0) {
      if (hasApiKey) {
        setMessages([{ role: 'model', text: 'Hoi! Ik ben de slimme assistent van **LO Academie**. \n\nWaar ben je naar op zoek? Ik kan je helpen bij:\n- Het vinden van een cursus\n- Uitleg over vaktermen (zoals *MRT* of *BSM*)\n- Advies over je ontwikkeling' }]);
      } else {
        setMessages([{ 
          role: 'model', 
          text: '⚠️ **Configuratie vereist**\n\nDe slimme zoekhulp is nog niet actief. Maak een `.env` bestand aan in de root van je project en voeg de regel `API_KEY=jouw-sleutel` toe om te starten.' 
        }]);
      }
    }
  }, [hasApiKey, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatContainerRef.current && !chatContainerRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading || !hasApiKey) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    const response = await getSmartRecommendations(userText, courses);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  return (
    <div ref={chatContainerRef}>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-xl shadow-[#00C1D4]/20 transition-all duration-300 flex items-center gap-2
          ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
          ${hasApiKey ? 'bg-gradient-to-r from-[#00C1D4] to-[#0096a6] hover:scale-110' : 'bg-slate-400 hover:bg-slate-500'} text-white`}
      >
        {hasApiKey ? <Sparkles className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
        <span className="font-bold hidden md:inline">Slimme Zoekhulp</span>
      </button>

      {/* Chat Interface */}
      <div className={`fixed bottom-6 right-6 z-50 w-full md:w-[400px] h-[550px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 transform origin-bottom-right
        ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none translate-y-10'}`}>
        
        {/* Chat Header */}
        <div className={`p-4 rounded-t-2xl flex justify-between items-center text-white
          ${hasApiKey ? 'bg-gradient-to-r from-[#7AB800] to-[#00C1D4]' : 'bg-slate-600'}`}>
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6" />
            <h3 className="font-bold text-lg">LO Assistent {hasApiKey ? '' : '(Offline)'}</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#00C1D4] text-white rounded-tr-none font-medium' 
                  : 'bg-white border border-slate-100 text-slate-600 rounded-tl-none'
              }`}>
                <MarkdownText text={msg.text} isUser={msg.role === 'user'} />
              </div>
            </div>
          ))}
          {loading && (
             <div className="flex justify-start">
               <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5">
                 <div className="w-2 h-2 bg-[#7AB800] rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-[#7AB800] rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-[#7AB800] rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7AB800] text-sm disabled:bg-slate-100 disabled:text-slate-400"
              placeholder={hasApiKey ? "Typ je vraag..." : "API Key ontbreekt in configuratie"}
              value={input}
              disabled={!hasApiKey || loading}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim() || !hasApiKey}
              className="p-3 bg-[#7AB800] text-white rounded-xl hover:bg-[#6da500] disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};