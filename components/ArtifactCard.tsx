
import React from 'react';
import { Artifact, ExpertRole } from '../types';
import { Compass, Code, Layout, Database, PencilRuler, ArrowUpRight } from 'lucide-react';

interface ArtifactCardProps {
  artifact: Artifact;
  delay: number;
  onClick: () => void;
}

const getRoleIcon = (role: ExpertRole) => {
  switch (role) {
    case ExpertRole.ARCHITECT: return <Compass className="w-5 h-5" />;
    case ExpertRole.UX: return <PencilRuler className="w-5 h-5" />;
    case ExpertRole.UI: return <Layout className="w-5 h-5" />;
    case ExpertRole.COMPONENT: return <Code className="w-5 h-5" />;
    case ExpertRole.DATA: return <Database className="w-5 h-5" />;
  }
};

const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, delay, onClick }) => {
  return (
    <div 
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="m3-card group relative h-[460px] bg-[#2B2930] hover:bg-[#322F37] border border-transparent hover:border-[#D0BCFF]/20 cursor-pointer elevation-1 hover:elevation-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-forwards flex flex-col"
    >
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-[#4F378B] text-[#D0BCFF] flex items-center justify-center flex-shrink-0">
            {getRoleIcon(artifact.role)}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-lg font-bold tracking-tight text-[#E6E1E5] truncate">{artifact.title}</h4>
            <p className="text-[10px] text-[#CAC4D0] font-bold uppercase tracking-widest">{artifact.role}</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-[#D0BCFF] transition-colors" />
        </div>

        {/* Visual Stage (The Core of UIFlash) */}
        <div className="flex-1 bg-[#1C1B1F] rounded-[24px] p-5 mb-6 relative overflow-hidden group-hover:shadow-inner transition-shadow border border-white/5">
          {artifact.type === 'ui-layout' && (
             <div className="h-full space-y-3 opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="h-8 w-full bg-[#49454F] rounded-lg border border-white/5" />
                <div className="flex gap-3 h-2/3">
                  <div className="w-1/4 bg-[#49454F]/30 rounded-xl border border-dashed border-[#938F99]/20 flex items-center justify-center">
                    <div className="w-1 h-12 bg-zinc-800 rounded-full" />
                  </div>
                  <div className="w-3/4 flex flex-col gap-3">
                    <div className="h-2/3 bg-[#49454F]/20 rounded-xl grid grid-cols-2 gap-2 p-2">
                       <div className="bg-[#49454F]/40 rounded-lg"></div>
                       <div className="bg-[#49454F]/40 rounded-lg"></div>
                    </div>
                    <div className="h-1/3 bg-[#49454F]/10 rounded-xl border border-white/5" />
                  </div>
                </div>
             </div>
          )}
          
          {artifact.type === 'ux-flow' && (
             <div className="h-full flex flex-col justify-center items-center gap-2 opacity-60 group-hover:opacity-100">
                {[1, 2, 3].map(i => (
                  <React.Fragment key={i}>
                    <div className="w-32 py-2.5 px-4 bg-[#D0BCFF]/10 border border-[#D0BCFF]/30 text-[#D0BCFF] rounded-xl text-[9px] font-black tracking-widest text-center uppercase">
                      Action {i}
                    </div>
                    {i < 3 && <div className="h-4 w-px bg-gradient-to-b from-[#D0BCFF]/30 to-transparent" />}
                  </React.Fragment>
                ))}
             </div>
          )}

          {artifact.type === 'data-schema' && (
             <div className="space-y-4 opacity-60 group-hover:opacity-100 font-mono text-[9px]">
                <div className="bg-[#49454F]/20 p-3 rounded-xl border border-white/5">
                   <div className="text-[#D0BCFF] font-black mb-2 uppercase tracking-tighter">Collections</div>
                   <div className="space-y-1">
                     <div className="flex justify-between"><span>_id</span> <span className="text-zinc-600">PK</span></div>
                     <div className="flex justify-between"><span>user_ref</span> <span className="text-zinc-600">FK</span></div>
                     <div className="flex justify-between"><span>meta_json</span> <span className="text-zinc-600">OBJ</span></div>
                   </div>
                </div>
                <div className="bg-[#49454F]/10 p-2 rounded-lg border border-white/5 text-zinc-500">
                  Relational Map Ready
                </div>
             </div>
          )}

          {artifact.type === 'text' && (
             <div className="text-[12px] text-[#CAC4D0] leading-relaxed font-light overflow-hidden h-full">
               {artifact.content}
             </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1C1B1F] to-transparent pointer-events-none" />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mt-auto">
          <div className="flex -space-x-1.5">
            <div className="w-6 h-6 rounded-full border-2 border-[#2B2930] bg-[#4F378B] flex items-center justify-center text-[8px] font-bold">M1</div>
            <div className="w-6 h-6 rounded-full border-2 border-[#2B2930] bg-[#322F37] flex items-center justify-center text-[8px] font-bold">M2</div>
          </div>
          <button className="text-[10px] font-black text-[#D0BCFF] uppercase tracking-[0.2em] group-hover:tracking-[0.3em] transition-all">
            Open Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtifactCard;
