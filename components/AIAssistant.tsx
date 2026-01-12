import React, { useState, useRef, useEffect } from 'react';
import { Course, ChatMessage } from '../types';
import { getSmartRecommendations } from '../services/geminiService';
import { Sparkles, Send, X, Bot } from 'lucide-react';

interface AIAssistantProps {
  courses: Course[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ courses }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hoi! Ik ben de slimme assistent van LO Academie. Waar ben je naar op zoek?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    if (!input.trim() || loading) return;

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
          bg-gradient-to-r from-[#00C1D4] to-[#0096a6] text-white hover:scale-110`}
      >
        <Sparkles className="w-6 h-6" />
        <span className="font-bold hidden md:inline">Slimme Zoekhulp</span>
      </button>

      {/* Chat Interface */}
      <div className={`fixed bottom-6 right-6 z-50 w-full md:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col transition-all duration-300 transform origin-bottom-right
        ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none translate-y-10'}`}>
        
        {/* Chat Header */}
        <div className="p-4 bg-gradient-to-r from-[#7AB800] to-[#00C1D4] rounded-t-2xl flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6" />
            <h3 className="font-bold text-lg">LO Assistent</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#00C1D4] text-white rounded-tr-none' 
                  : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
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
              className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7AB800] text-sm"
              placeholder="Typ je vraag..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button 
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="p-3 bg-[#7AB800] text-white rounded-xl hover:bg-[#6da500] disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};