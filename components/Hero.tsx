import React, { useEffect, useState } from 'react';
import { CalendarCheck, Users, Trophy } from 'lucide-react';

interface HeroProps {
  courseCount: number;
  onScrollToContent: () => void;
}

const AnimatedCounter: React.FC<{ end: number, duration?: number }> = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Ease out quart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(ease * end));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count}</span>;
};

export const Hero: React.FC<HeroProps> = ({ courseCount, onScrollToContent }) => {
  return (
    <div className="relative bg-[#1e293b] overflow-hidden mb-8">
      {/* Background Pattern/Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://www.alo.nl/custom/uploads/2019/05/gymzaal1-1.jpg"
          alt="Gymzaalvloer met belijning" 
          className="w-full h-full object-cover opacity-40"
        />
        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e293b] via-[#1e293b]/80 to-[#1e293b]/30"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6 leading-tight drop-shadow-lg">
            Ontwikkel jezelf als <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7AB800] to-[#00C1D4]">
              bewegingsprofessional
            </span>
          </h1>
          
          <p className="text-lg text-slate-100 mb-8 leading-relaxed max-w-2xl drop-shadow-md font-medium">
            De centrale plek voor alle bijscholingen, cursussen en congressen van 
            <strong className="text-white"> KVLO</strong> en <strong className="text-white">ALO Nederland</strong>. 
            Vind de verdieping die bij jou past.
          </p>

          <div className="flex flex-wrap gap-4 md:gap-8 border-t border-slate-500/50 pt-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#7AB800]/20 rounded-lg backdrop-blur-sm border border-[#7AB800]/30">
                <CalendarCheck className="w-6 h-6 text-[#7AB800]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white shadow-black drop-shadow-sm">
                    <AnimatedCounter end={courseCount} />
                </div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Actuele Scholingen</div>
              </div>
            </div>

            <div className="w-px h-12 bg-slate-500/50 hidden sm:block"></div>

            <div className="flex items-center gap-3">
               <div className="p-2 bg-[#00C1D4]/20 rounded-lg backdrop-blur-sm border border-[#00C1D4]/30">
                <Users className="w-6 h-6 text-[#00C1D4]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white shadow-black drop-shadow-sm">2</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Top Partners</div>
              </div>
            </div>

            <div className="w-px h-12 bg-slate-500/50 hidden sm:block"></div>

            <div className="flex items-center gap-3">
               <div className="p-2 bg-purple-500/20 rounded-lg backdrop-blur-sm border border-purple-500/30">
                <Trophy className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white shadow-black drop-shadow-sm">100%</div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">Vakinhoudelijk</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Bottom Curve */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#F9FAFB] to-transparent"></div>
    </div>
  );
};