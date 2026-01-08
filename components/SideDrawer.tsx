
import React, { useState } from 'react';
import { Artifact } from '../types';
import { 
  X, 
  Copy, 
  CheckCircle, 
  Share2, 
  Archive, 
  Trash2, 
  Database, 
  Zap, 
  Code as CodeIcon, 
  Monitor, 
  Users, 
  ShieldAlert, 
  Cpu, 
  CreditCard,
  Target,
  Scissors,
  BarChart3,
  Rocket,
  ShieldCheck,
  Layout
} from 'lucide-react';

interface SideDrawerProps {
  artifact: Artifact | null;
  onClose: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ artifact, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  if (!artifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderProjection = () => {
    if (artifact.type === 'prototype') {
       return (
         <div className="space-y-6">
            <div className="flex bg-[#09090b] rounded-full p-1 border border-white/5 self-start w-fit">
              <button 
                onClick={() => setViewMode('preview')} 
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-[#D0BCFF] text-[#381E72] shadow-xl' : 'text-zinc-500 hover:text-white'}`}
              >
                <Monitor className="w-3.5 h-3.5" /> Interactive Projection
              </button>
              <button 
                onClick={() => setViewMode('code')} 
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'code' ? 'bg-[#D0BCFF] text-[#381E72] shadow-xl' : 'text-zinc-500 hover:text-white'}`}
              >
                <CodeIcon className="w-3.5 h-3.5" /> Source Code
              </button>
            </div>
            {viewMode === 'preview' ? (
              <div className="w-full aspect-[16/10] bg-white rounded-[32px] overflow-hidden border-8 border-[#27272a] shadow-2xl animate-in zoom-in-95 duration-500">
                <iframe srcDoc={artifact.content} title="Prototype" className="w-full h-full" sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin" />
              </div>
            ) : (
              <div className="bg-[#09090b] p-8 rounded-[32px] border border-white/10 overflow-x-auto max-h-[600px] custom-scrollbar shadow-inner">
                <pre className="text-xs font-mono text-[#D0BCFF] leading-relaxed select-all">
                  {artifact.content}
                </pre>
              </div>
            )}
         </div>
       );
    }

    const p = artifact.projection;
    if (!p) return null;

    if (artifact.type === 'persona-profile' && p.personas) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {p.personas.map((per: any, i: number) => (
            <div key={i} className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 space-y-6 hover:border-[#D0BCFF]/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#D0BCFF]/10 text-[#D0BCFF] flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="w-7 h-7" /></div>
                <div>
                  <h5 className="font-bold text-lg text-white leading-none">{per.name}</h5>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-black">{per.role}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                   <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2">Primary Goals</p>
                   <div className="flex flex-wrap gap-2">{per.goals.map((g: string, j: number) => <span key={j} className="text-[10px] px-3 py-1 bg-[#4F378B]/20 text-[#D0BCFF] rounded-full border border-[#D0BCFF]/10">{g}</span>)}</div>
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2">Pain Points</p>
                   <div className="flex flex-wrap gap-2">{per.frustrations.map((f: string, j: number) => <span key={j} className="text-[10px] px-3 py-1 bg-red-400/5 text-red-400/60 rounded-full border border-red-400/10 italic">"{f}"</span>)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (artifact.type === 'risk-analysis' && p.risks) {
      return (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 px-2">
            <ShieldAlert className="w-3 h-3" /> Risk Assessment Matrix
          </h4>
          {p.risks.map((r: any, i: number) => (
            <div key={i} className="bg-[#18181b] p-6 rounded-[28px] border border-white/5 flex gap-6 items-center">
              <div className={`w-3 h-12 rounded-full flex-shrink-0 ${r.severity === 'High' ? 'bg-red-500/40' : 'bg-yellow-500/40'}`} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="font-bold text-white text-base">{r.area}</h5>
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${r.severity === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{r.severity} Severity</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed"><span className="text-white/60 font-bold uppercase text-[9px]">Mitigation:</span> {r.mitigation}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (artifact.type === 'tech-roadmap' && p.stack) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(p.stack).map(([key, val]: any) => (
            <div key={key} className="bg-[#18181b] p-6 rounded-[32px] border border-white/5 space-y-2 group hover:bg-[#D0BCFF]/5 transition-colors">
              <div className="flex justify-between items-start">
                 <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{key}</p>
                 <Cpu className="w-4 h-4 text-[#D0BCFF]/40 group-hover:text-[#D0BCFF] transition-colors" />
              </div>
              <p className="text-lg font-bold text-white leading-tight">{val}</p>
            </div>
          ))}
        </div>
      );
    }

    if (artifact.type === 'monetization-plan' && p.tiers) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {p.tiers.map((t: any, i: number) => (
            <div key={i} className={`bg-[#18181b] p-6 rounded-[36px] border ${i === 1 ? 'border-[#D0BCFF]/40 bg-[#D0BCFF]/5' : 'border-white/5'} text-center space-y-6 relative overflow-hidden`}>
              {i === 1 && <div className="absolute top-0 inset-x-0 h-1 bg-[#D0BCFF]" />}
              <div>
                <h5 className="font-black text-[10px] uppercase text-[#D0BCFF] tracking-[0.3em] mb-2">{t.name}</h5>
                <p className="text-3xl font-black text-white">{t.price}</p>
              </div>
              <div className="space-y-3 pt-2 text-left">
                 {t.features.map((f: string, j: number) => (
                   <div key={j} className="flex gap-2 items-start">
                     <CheckCircle className="w-3 h-3 text-[#D0BCFF] flex-shrink-0 mt-0.5" />
                     <p className="text-[10px] text-zinc-400 leading-tight">{f}</p>
                   </div>
                 ))}
              </div>
              <button className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${i === 1 ? 'bg-[#D0BCFF] text-[#381E72]' : 'bg-white/5 text-white'}`}>Select Tier</button>
            </div>
          ))}
        </div>
      );
    }

    if (artifact.type === 'ux-flow' && p.steps) {
       return (
         <div className="space-y-4">
            {p.steps.map((step: any, i: number) => (
              <div key={i} className="flex gap-6 items-start group">
                <div className="flex flex-col items-center gap-2 pt-1">
                   <div className="w-8 h-8 rounded-xl bg-[#4F378B]/40 text-[#D0BCFF] flex items-center justify-center font-black text-[10px] shadow-inner group-hover:scale-110 transition-transform">{i + 1}</div>
                   {i < p.steps.length - 1 && <div className="w-px h-12 bg-white/10" />}
                </div>
                <div className="flex-1 bg-[#18181b] p-6 rounded-[28px] border border-white/5">
                   <h6 className="font-black text-[11px] uppercase text-white tracking-widest mb-1">{step.label}</h6>
                   <p className="text-xs text-zinc-500 leading-relaxed font-light">{step.desc}</p>
                </div>
              </div>
            ))}
         </div>
       );
    }

    if (artifact.type === 'ui-layout' && p.layout) {
      return (
        <div className="grid grid-cols-1 gap-4">
           {p.layout.map((zone: any, i: number) => (
             <div key={i} className="bg-[#18181b] p-6 rounded-[28px] border border-white/5 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-white/5 rounded-lg"><Layout className="w-4 h-4 text-zinc-500" /></div>
                   <h6 className="font-black text-[11px] uppercase text-white tracking-widest">{zone.area}</h6>
                </div>
                <div className="flex flex-wrap gap-2">
                   {zone.items.map((item: string, j: number) => (
                     <span key={j} className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-zinc-400 border border-white/5">
                       {item}
                     </span>
                   ))}
                </div>
             </div>
           ))}
        </div>
      );
    }

    return (
      <div className="bg-[#18181b] p-8 rounded-[40px] border border-white/5">
         <div className="prose prose-invert max-w-none">
            <div className="text-[#CAC4D0] leading-relaxed text-sm font-light italic">
              "{artifact.summary}"
            </div>
         </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-[100] animate-in fade-in duration-300 backdrop-blur-xl" onClick={onClose} />
      
      <div className="fixed top-0 right-0 h-full w-full max-w-3xl bg-[#09090b] z-[101] shadow-2xl md:rounded-l-[56px] animate-in slide-in-from-right duration-500 flex flex-col border-l border-white/5 overflow-hidden">
        {/* Modal Handle */}
        <div className="w-full h-8 flex justify-center items-center mt-2 flex-shrink-0">
          <div className="w-16 h-1 bg-white/10 rounded-full" />
        </div>

        {/* Content Header */}
        <div className="px-10 pb-8 flex justify-between items-center border-b border-white/5 pt-6 flex-shrink-0 bg-[#09090b]">
          <div className="flex items-center gap-6">
            <button onClick={onClose} className="p-3 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-white bg-white/5">
              <X className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{artifact.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-[10px] uppercase tracking-[0.4em] text-[#D0BCFF] font-black">{artifact.role}</p>
                <div className="px-2 py-0.5 bg-[#D0BCFF]/10 rounded-full text-[8px] font-black text-[#D0BCFF] uppercase">Expert Projection</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-3.5 rounded-full hover:bg-white/5 transition-colors text-zinc-400 bg-white/5"><Share2 className="w-5 h-5" /></button>
            <button className="p-3.5 rounded-full hover:bg-white/5 transition-colors text-zinc-400 bg-white/5"><Archive className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12 bg-[#09090b]">
          {renderProjection()}

          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-white/5 pb-3">
               <ShieldCheck className="w-4 h-4 text-[#D0BCFF]" />
               <h4 className="text-[11px] font-black text-[#D0BCFF] uppercase tracking-[0.3em]">Decision Reasoning Log</h4>
            </div>
            <div className="space-y-6 text-[#CAC4D0] leading-relaxed text-sm font-light">
              {artifact.summary.split('\n').map((line, i) => (
                <p key={i} className="mb-2 italic">"{line}"</p>
              ))}
              <div className="p-8 bg-[#18181b] rounded-[32px] border border-white/5 text-xs text-zinc-500 font-mono leading-relaxed opacity-60">
                 // System Trace Data: <br/>
                 ID: {artifact.id} <br/>
                 Modality: {artifact.type} <br/>
                 Context_Injected: true <br/>
                 Intent_Alignment: verified <br/>
                 Expert_Credibility: high
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-10 border-t border-white/5 bg-[#18181b]/80 flex items-center justify-between backdrop-blur-2xl flex-shrink-0">
          <div className="flex gap-4">
             <button className="m3-button h-16 px-10 bg-[#D0BCFF] text-[#381E72] flex items-center gap-3 hover:elevation-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl font-black text-sm uppercase tracking-widest group">
               <Zap className="w-5 h-5 group-hover:animate-pulse" />
               Finalize Spec
             </button>
             <button onClick={handleCopy} className="m3-button h-16 px-8 bg-transparent border border-white/10 text-[#D0BCFF] flex items-center gap-3 hover:bg-white/5 transition-colors font-bold text-sm uppercase tracking-widest">
               {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               {copied ? 'Copied' : 'Copy Code'}
             </button>
          </div>
          <button className="p-4 text-zinc-700 hover:text-red-400 transition-colors"><Trash2 className="w-6 h-6" /></button>
        </div>
      </div>
    </>
  );
};

export default SideDrawer;
