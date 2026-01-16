import React, { useState, useRef, useEffect } from 'react';
import { Course, ChatMessage } from '../types';
import { getSmartRecommendations } from '../services/geminiService';
import { Sparkles, Send, X, Bot, Lock, GraduationCap, ChevronRight, User, Target, MapPin } from 'lucide-react';

interface AIAssistantProps {
  courses: Course[];
}

// Simple Markdown Formatter Component
const MarkdownText: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const parseInline = (line: string) => {
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={isUser ? 'font-black' : 'font-bold text-slate-900'}>{part.slice(2, -2)}</strong>;
      }
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
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.substring(2));
    } else {
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
      if (trimmed.startsWith('### ')) {
        elements.push(<h3 key={index} className="font-bold text-sm mt-4 mb-1 uppercase tracking-wider opacity-80">{parseInline(trimmed.substring(4))}</h3>);
      } else if (trimmed !== '') {
        elements.push(<p key={index} className="mb-2 last:mb-0 leading-relaxed">{parseInline(trimmed)}</p>);
      }
    }
  });

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

// Wizard Data
const WIZARD_STEPS = [
  {
    id: 1,
    title: "Wat is je rol?",
    icon: <User className="w-5 h-5" />,
    options: ["PO Docent", "VO Docent", "MBO/HBO Docent", "Student / Starter", "Anders"]
  },
  {
    id: 2,
    title: "Waar wil je op focussen?",
    icon: <Target className="w-5 h-5" />,
    options: ["Vakinhoudelijke verdieping", "Didactiek & Pedagogiek", "Persoonlijke groei", "Netwerken"]
  },
  {
    id: 3,
    title: "Voorkeur voor locatie?",
    icon: <MapPin className="w-5 h-5" />,
    options: ["Geen voorkeur", "Midden-Nederland", "Bij mij in de buurt", "Online"]
  }
];

export const AIAssistant: React.FC<AIAssistantProps> = ({ courses }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasApiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY && process.env.API_KEY !== "undefined" && process.env.API_KEY !== "";

  const [mode, setMode] = useState<'intro' | 'chat' | 'wizard'>('intro');
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<string[]>([]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset if closed
    if (!isOpen) {
        setTimeout(() => setMode('intro'), 300);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && mode === 'chat') scrollToBottom();
  }, [messages, isOpen, mode]);

  const startChat = () => {
    setMode('chat');
    if (messages.length === 0) {
       setMessages([{ role: 'model', text: 'Stel me gerust een vraag over het scholingsaanbod!' }]);
    }
  };

  const startWizard = () => {
    setMode('wizard');
    setWizardStep(0);
    setWizardAnswers([]);
  };

  const handleWizardOption = async (option: string) => {
    const newAnswers = [...wizardAnswers, option];
    setWizardAnswers(newAnswers);

    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep(prev => prev + 1);
    } else {
      // Wizard Complete, Switch to Chat and Generate
      setMode('chat');
      setLoading(true);
      
      const prompt = `
        Ik ben een **${newAnswers[0]}** en ik wil graag werken aan **${newAnswers[1]}**.
        Mijn voorkeur voor locatie is: **${newAnswers[2]}**.
        
        Maak een kort en persoonlijk scholingsadvies voor mij op basis van het huidige aanbod.
      `;

      // Show the formulated query as a user message
      setMessages(prev => [...prev, { role: 'user', text: `Advies voor: ${newAnswers[0]}, Focus: ${newAnswers[1]}, Regio: ${newAnswers[2]}` }]);
      
      const response = await getSmartRecommendations(prompt, courses);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
      setLoading(false);
    }
  };

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
        className={`fixed bottom-6 right-6 z-[60] p-4 rounded-full shadow-2xl shadow-[#00C1D4]/30 transition-all duration-300 flex items-center gap-2
          ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}
          bg-gradient-to-r from-[#00C1D4] to-[#0096a6] hover:scale-110 text-white cursor-pointer`}
      >
        {hasApiKey ? <Sparkles className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
        <span className="font-bold hidden md:inline">Studieadviseur</span>
      </button>

      {/* Main Container 
          - On Desktop: Bottom Right Popup
          - On Mobile: Full Screen Fixed Overlay to prevent layout issues
      */}
      <div className={`fixed z-[70] transition-all duration-500 shadow-2xl bg-white border-0 md:border border-slate-200 overflow-hidden flex flex-col
        ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none translate-y-20'}
        
        /* Mobile Styles */
        inset-0 w-full h-full rounded-none
        
        /* Desktop Styles */
        md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[600px] md:rounded-3xl
      `}>
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#7AB800] to-[#00C1D4] opacity-90"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
               <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
               <h3 className="font-bold text-lg leading-tight">LO Academie</h3>
               <p className="text-[10px] text-white/80 font-medium uppercase tracking-wider">
                 {mode === 'wizard' ? 'Keuzehulp' : 'AI Assistent'}
               </p>
            </div>
          </div>
          
          {/* Close Button - Added z-50 and cursor-pointer to fix PC click issue */}
          <button 
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
            }} 
            className="relative z-50 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
            
            {/* MODE: INTRO */}
            {mode === 'intro' && (
               <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-white rounded-full shadow-xl mb-6 flex items-center justify-center text-[#00C1D4]">
                     <GraduationCap className="w-10 h-10" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 mb-2">Hulp nodig bij kiezen?</h2>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    Ik kan je helpen de perfecte bijscholing te vinden op basis van jouw profiel, of je kunt me gewoon een vraag stellen.
                  </p>
                  
                  <div className="space-y-3 w-full">
                     <button 
                       onClick={startWizard}
                       disabled={!hasApiKey}
                       className="w-full py-4 bg-[#7AB800] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       <Sparkles className="w-5 h-5" /> Start Keuzehulp
                     </button>
                     <button 
                        onClick={startChat}
                        disabled={!hasApiKey}
                        className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                     >
                        Stel een vraag
                     </button>
                     {!hasApiKey && <p className="text-xs text-red-400 mt-2">Geen API Key geconfigureerd</p>}
                  </div>
               </div>
            )}

            {/* MODE: WIZARD */}
            {mode === 'wizard' && (
               <div className="absolute inset-0 p-6 flex flex-col animate-in slide-in-from-right duration-300">
                  <div className="mb-6">
                     <div className="flex gap-1 mb-4">
                        {WIZARD_STEPS.map((step, idx) => (
                           <div key={step.id} className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${idx <= wizardStep ? 'bg-[#00C1D4]' : 'bg-slate-200'}`} />
                        ))}
                     </div>
                     <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-3">
                       {WIZARD_STEPS[wizardStep].icon}
                       {WIZARD_STEPS[wizardStep].title}
                     </h2>
                  </div>

                  <div className="space-y-3">
                     {WIZARD_STEPS[wizardStep].options.map((option, idx) => (
                        <button
                           key={idx}
                           onClick={() => handleWizardOption(option)}
                           className="w-full text-left p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:border-[#00C1D4] hover:text-[#00C1D4] hover:shadow-md transition-all flex justify-between items-center group"
                        >
                           {option}
                           <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-[#00C1D4]" />
                        </button>
                     ))}
                  </div>

                  <button onClick={() => setMode('intro')} className="mt-auto text-center text-xs text-slate-400 hover:text-slate-600 font-bold py-4">
                     Annuleren
                  </button>
               </div>
            )}

            {/* MODE: CHAT */}
            {mode === 'chat' && (
               <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
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

                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2">
                        <input 
                        type="text" 
                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7AB800] text-sm font-medium"
                        placeholder="Typ een bericht..."
                        value={input}
                        disabled={loading}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        />
                        <button 
                        onClick={handleSend}
                        disabled={loading || !input.trim()}
                        className="p-3 bg-[#7AB800] text-white rounded-xl hover:bg-[#6da500] disabled:opacity-50 transition-colors shadow-sm"
                        >
                        <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
               </>
            )}
        </div>
      </div>
    </div>
  );
};