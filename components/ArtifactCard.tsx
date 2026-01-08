
import React from 'react';
import { Artifact, ExpertRole } from '../types';
import { Compass, Code, Layout, Database, PencilRuler, ArrowUpRight, Zap, Component } from 'lucide-react';

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
    case ExpertRole.COMPONENT: return <Component className="w-5 h-5" />;
    case ExpertRole.DATA: return <Database className="w-5 h-5" />;
    case ExpertRole.PROTOTYPER: return <Zap className="w-5 h-5" />;
    default: return <Code className="w-5 h-5" />;
  }
};

const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, delay, onClick }) => {
  const isPrototype = artifact.type === 'prototype';

  return (
    <div 
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`m3-card group relative h-[500px] bg-[#2B2930] hover:bg-[#322F37] border border-transparent hover:border-[#D0BCFF]/30 cursor-pointer elevation-1 hover:elevation-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6 fill-mode-forwards flex flex-col overflow-hidden ${isPrototype ? 'ring-2 ring-[#D0BCFF]/20' : ''}`}
    >
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#4F378B] text-[#D0BCFF] flex items-center justify-center flex-shrink-0">
            {getRoleIcon(artifact.role)}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-base font-bold tracking-tight text-[#E6E1E5] truncate">{artifact.title}</h4>
            <p className="text-[9px] text-[#CAC4D0] font-bold uppercase tracking-widest">{artifact.role}</p>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-[#D0BCFF] transition-colors" />
        </div>

        {/* Visual Stage */}
        <div className="flex-1 bg-[#1C1B1F] rounded-[24px] mb-6 relative overflow-hidden group-hover:shadow-inner transition-shadow border border-white/5">
          {isPrototype ? (
            <div className="w-full h-full relative group/proto">
              <iframe 
                srcDoc={artifact.content} 
                title={artifact.id}
                className="w-[1000px] h-[750px] scale-[0.3] origin-top-left absolute"
                sandbox="allow-scripts"
              />
              <div className="absolute inset-0 bg-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#1C1B1F] to-transparent">
                 <div className="px-3 py-1 bg-[#D0BCFF] text-[#381E72] rounded-full text-[10px] font-black uppercase inline-block">Interactive Prototype</div>
              </div>
            </div>
          ) : (
            <div className="p-5 h-full">
              {artifact.type === 'ui-layout' && (
                 <div className="h-full space-y-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="h-8 w-full bg-[#49454F] rounded-lg border border-white/5" />
                    <div className="flex gap-3 h-2/3">
                      <div className="w-1/4 bg-[#49454F]/30 rounded-xl border border-dashed border-[#938F99]/20" />
                      <div className="w-3/4 flex flex-col gap-3">
                        <div className="h-2/3 bg-[#49454F]/20 rounded-xl grid grid-cols-2 gap-2 p-2" />
                        <div className="h-1/3 bg-[#49454F]/10 rounded-xl border border-white/5" />
                      </div>
                    </div>
                 </div>
              )}
              
              {artifact.type === 'ux-flow' && (
                 <div className="h-full flex flex-col justify-center items-center gap-2 opacity-60 group-hover:opacity-100">
                    {[1, 2, 3].map(i => (
                      <React.Fragment key={i}>
                        <div className="w-32 py-2 px-4 bg-[#D0BCFF]/10 border border-[#D0BCFF]/30 text-[#D0BCFF] rounded-xl text-[9px] font-black tracking-widest text-center uppercase">
                          Journey State {i}
                        </div>
                        {i < 3 && <div className="h-3 w-px bg-[#D0BCFF]/20" />}
                      </React.Fragment>
                    ))}
                 </div>
              )}

              {artifact.type === 'component-map' && (
                <div className="h-full space-y-3 opacity-60 group-hover:opacity-100">
                  <div className="flex flex-wrap gap-2">
                    {['Button', 'Card', 'Input', 'Modal'].map(c => (
                      <span key={c} className="px-2 py-1 bg-[#4F378B]/40 rounded-lg text-[10px] text-[#D0BCFF]">{c}</span>
                    ))}
                  </div>
                  <div className="p-3 bg-[#4F378B]/10 rounded-xl border border-white/5 text-[9px] text-zinc-500">Design System Ready</div>
                </div>
              )}

              {artifact.type === 'data-schema' && (
                 <div className="space-y-4 opacity-60 group-hover:opacity-100 font-mono text-[9px]">
                    <div className="bg-[#49454F]/20 p-3 rounded-xl border border-white/5">
                       <div className="text-[#D0BCFF] font-black mb-2 uppercase">Collections</div>
                       <div className="space-y-1">
                         <div className="flex justify-between"><span>_id</span> <span className="text-zinc-600">UUID</span></div>
                         <div className="flex justify-between"><span>created_at</span> <span className="text-zinc-600">ISO</span></div>
                       </div>
                    </div>
                 </div>
              )}

              {artifact.type === 'text' && (
                 <div className="text-[11px] text-[#CAC4D0] leading-relaxed font-light overflow-hidden h-full">
                   {artifact.content}
                 </div>
              )}
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
            {isPrototype ? 'Open Sandbox' : 'View Spec'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtifactCard;
