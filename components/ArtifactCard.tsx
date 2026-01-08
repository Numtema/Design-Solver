
import React from 'react';
import { Artifact, ExpertRole } from '../types';
import { 
  Compass, 
  Code, 
  Layout, 
  Database, 
  PencilRuler, 
  ArrowUpRight, 
  // Fix: Added missing ArrowRight icon
  ArrowRight,
  Zap, 
  Component, 
  Users, 
  AlertTriangle, 
  Cpu, 
  CircleDollarSign, 
  ShieldCheck, 
  Target,
  Scissors,
  BarChart3,
  Rocket,
  ClipboardList,
  // Fix: Added missing MousePointer2 icon
  MousePointer2
} from 'lucide-react';

interface ArtifactCardProps {
  artifact: Artifact;
  delay: number;
  onClick: () => void;
}

const getRoleIcon = (role: ExpertRole) => {
  switch (role) {
    case ExpertRole.INTENT: return <Target className="w-5 h-5" />;
    case ExpertRole.CARTOGRAPHER: return <Compass className="w-5 h-5" />;
    case ExpertRole.UX: return <PencilRuler className="w-5 h-5" />;
    case ExpertRole.UI: return <Layout className="w-5 h-5" />;
    case ExpertRole.COMPONENT: return <Component className="w-5 h-5" />;
    case ExpertRole.DATA: return <Database className="w-5 h-5" />;
    case ExpertRole.PERSONA: return <Users className="w-5 h-5" />;
    case ExpertRole.RISK: return <AlertTriangle className="w-5 h-5" />;
    case ExpertRole.TECH_STACK: return <Cpu className="w-5 h-5" />;
    case ExpertRole.PRICING: return <CircleDollarSign className="w-5 h-5" />;
    case ExpertRole.CONSISTENCY: return <ShieldCheck className="w-5 h-5" />;
    case ExpertRole.SIMPLIFIER: return <Scissors className="w-5 h-5" />;
    case ExpertRole.GTM: return <Rocket className="w-5 h-5" />;
    case ExpertRole.ESTIMATION: return <BarChart3 className="w-5 h-5" />;
    case ExpertRole.API_CONTRACT: return <ClipboardList className="w-5 h-5" />;
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
      className={`m3-card group relative h-[520px] bg-[#18181b] hover:bg-[#1e1e21] border border-white/5 hover:border-[#D0BCFF]/30 cursor-pointer elevation-1 hover:elevation-3 transition-all duration-500 animate-in fade-in slide-in-from-bottom-6 fill-mode-forwards flex flex-col overflow-hidden ${isPrototype ? 'ring-2 ring-[#D0BCFF]/20 ring-offset-4 ring-offset-[#09090b]' : ''}`}
    >
      <div className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-[18px] bg-[#4F378B]/40 text-[#D0BCFF] flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
            {getRoleIcon(artifact.role)}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-base font-bold tracking-tight text-[#E6E1E5] truncate">{artifact.title}</h4>
            <div className="flex items-center gap-2">
               <p className="text-[10px] text-[#D0BCFF] font-black uppercase tracking-widest opacity-80">{artifact.role}</p>
               <span className="text-[8px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 font-mono">Conf: {(artifact.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-[#D0BCFF] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
        </div>

        {/* Visual Stage */}
        <div className="flex-1 bg-[#09090b] rounded-[28px] mb-6 relative overflow-hidden group-hover:shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] transition-all border border-white/5">
          {isPrototype ? (
            <div className="w-full h-full relative group/proto">
              <iframe 
                srcDoc={artifact.content} 
                title={artifact.id}
                className="w-[1280px] h-[800px] scale-[0.35] origin-top-left absolute opacity-90 group-hover:opacity-100 transition-opacity"
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
              />
              <div className="absolute inset-0 bg-transparent z-10" />
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-[#09090b] to-transparent">
                 <div className="px-4 py-1.5 bg-[#D0BCFF] text-[#381E72] rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 shadow-2xl">
                    <div className="w-1.5 h-1.5 bg-[#381E72] rounded-full animate-ping" />
                    Interactive Synthesis
                 </div>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full flex flex-col justify-between">
              <div className="text-sm text-[#CAC4D0] leading-relaxed font-light italic opacity-90 line-clamp-6">
                 "{artifact.summary}"
              </div>
              
              {/* Dynamic Mini-Visualizers based on Type */}
              <div className="h-24 flex items-center justify-center opacity-30 group-hover:opacity-70 transition-opacity">
                {artifact.type === 'persona-profile' && (
                  <div className="flex -space-x-4">
                    {[1, 2, 3].map(i => <div key={i} className="w-12 h-12 rounded-full border-4 border-[#09090b] bg-[#4F378B]/40 flex items-center justify-center"><Users className="w-5 h-5 text-[#D0BCFF]" /></div>)}
                  </div>
                )}
                {artifact.type === 'ux-flow' && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 border-2 border-[#D0BCFF]/20 rounded-lg" />
                    <ArrowRight className="w-4 h-4 text-zinc-700" />
                    <div className="w-12 h-12 border-2 border-[#D0BCFF]/40 rounded-lg bg-[#D0BCFF]/5" />
                    <ArrowRight className="w-4 h-4 text-zinc-700" />
                    <div className="w-10 h-10 border-2 border-[#D0BCFF]/20 rounded-lg" />
                  </div>
                )}
                {artifact.type === 'tech-roadmap' && (
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map(i => <div key={i} className="w-10 h-6 bg-white/5 rounded border border-white/5" />)}
                  </div>
                )}
                {artifact.type === 'data-schema' && (
                  <div className="w-3/4 space-y-2">
                    <div className="h-1.5 w-full bg-[#D0BCFF]/20 rounded-full" />
                    <div className="h-1.5 w-4/5 bg-white/5 rounded-full" />
                    <div className="h-1.5 w-2/3 bg-white/5 rounded-full" />
                  </div>
                )}
                {artifact.type === 'text' && (
                  <div className="flex flex-col items-center gap-2">
                    <Scissors className="w-8 h-8 text-zinc-700" />
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600">Optimization Matrix</span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mt-auto pt-2">
          <div className="flex -space-x-1.5">
            <div className="w-7 h-7 rounded-full border-2 border-[#18181b] bg-[#4F378B]/60 flex items-center justify-center text-[9px] font-black text-[#D0BCFF]">A1</div>
            <div className="w-7 h-7 rounded-full border-2 border-[#18181b] bg-[#2B2930] flex items-center justify-center text-[9px] font-black text-zinc-400 opacity-40">A2</div>
          </div>
          <button className="text-[10px] font-black text-[#D0BCFF] uppercase tracking-[0.3em] group-hover:tracking-[0.4em] transition-all flex items-center gap-2">
            Inspect Projection <MousePointer2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtifactCard;
