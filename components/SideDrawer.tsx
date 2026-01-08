
import React, { useState } from 'react';
import { Artifact } from '../types';
import { X, Copy, CheckCircle, Share2, Archive, Trash2, Database, Zap, Code as CodeIcon, Monitor } from 'lucide-react';

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
            <div className="flex bg-[#1C1B1F] rounded-full p-1 border border-white/5 self-start w-fit">
              <button 
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-[#D0BCFF] text-[#381E72]' : 'text-zinc-500 hover:text-white'}`}
              >
                <Monitor className="w-3 h-3" /> Live View
              </button>
              <button 
                onClick={() => setViewMode('code')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === 'code' ? 'bg-[#D0BCFF] text-[#381E72]' : 'text-zinc-500 hover:text-white'}`}
              >
                <CodeIcon className="w-3 h-3" /> Source
              </button>
            </div>

            {viewMode === 'preview' ? (
              <div className="w-full aspect-video bg-white rounded-3xl overflow-hidden border-8 border-[#2B2930] shadow-2xl animate-in zoom-in-95 duration-500">
                <iframe 
                  srcDoc={artifact.content} 
                  title="Prototype"
                  className="w-full h-full"
                  sandbox="allow-scripts"
                />
              </div>
            ) : (
              <div className="bg-[#1C1B1F] p-6 rounded-3xl border border-white/10 overflow-x-auto max-h-[500px] custom-scrollbar">
                <pre className="text-xs font-mono text-[#D0BCFF] leading-relaxed">
                  {artifact.content}
                </pre>
              </div>
            )}
            
            <div className="bg-[#D0BCFF]/5 border border-[#D0BCFF]/20 p-6 rounded-3xl">
               <h5 className="text-[10px] font-black text-[#D0BCFF] uppercase mb-2">Style Logic</h5>
               <p className="text-sm text-zinc-400 font-light">{artifact.projection?.style}</p>
            </div>
         </div>
       );
    }

    if (!artifact.projection) return null;

    if (artifact.type === 'ui-layout' && artifact.projection.layout) {
      return (
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-[#D0BCFF] uppercase tracking-[0.2em] mb-4">UI Grid Projection</h4>
          <div className="bg-[#1C1B1F] rounded-3xl border border-white/10 p-6 space-y-4">
            {artifact.projection.layout.map((zone: any, idx: number) => (
              <div key={idx} className="bg-[#2B2930] p-4 rounded-2xl border border-white/5">
                <div className="text-[10px] font-black uppercase text-zinc-600 mb-2">{zone.area}</div>
                <div className="flex flex-wrap gap-2">
                  {zone.items.map((item: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-[#4F378B]/30 text-[#D0BCFF] text-[10px] rounded-full border border-[#D0BCFF]/10">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (artifact.type === 'ux-flow' && artifact.projection.steps) {
      return (
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-[#D0BCFF] uppercase tracking-[0.2em] mb-4">Critical Journey</h4>
          <div className="flex flex-col gap-4">
            {artifact.projection.steps.map((step: any, idx: number) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="flex flex-col items-center pt-1">
                  <div className="w-6 h-6 rounded-full bg-[#D0BCFF] text-[#381E72] flex items-center justify-center font-black text-[10px]">{idx + 1}</div>
                  {idx < artifact.projection.steps.length - 1 && <div className="w-px h-10 bg-[#D0BCFF]/20 my-1" />}
                </div>
                <div className="flex-1 bg-[#2B2930] p-4 rounded-2xl border border-white/5">
                  <div className="font-bold text-white text-xs mb-1 uppercase tracking-wider">{step.label}</div>
                  <div className="text-[11px] text-zinc-400">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (artifact.type === 'data-schema' && artifact.projection.entities) {
      return (
        <div className="space-y-6">
          <h4 className="text-[10px] font-black text-[#D0BCFF] uppercase tracking-[0.2em] mb-4">Data Relational Model</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {artifact.projection.entities.map((entity: any, idx: number) => (
              <div key={idx} className="bg-[#1C1B1F] p-4 rounded-3xl border border-white/10 font-mono">
                <div className="text-[#D0BCFF] text-[10px] font-black uppercase mb-3 flex items-center gap-2">
                  <Database className="w-3 h-3" /> {entity.name}
                </div>
                <div className="space-y-1.5 opacity-70">
                  {entity.fields.map((field: string, i: number) => (
                    <div key={i} className="text-[10px] flex justify-between border-b border-white/5 pb-1 last:border-0">
                      <span>{field}</span>
                      <span className="text-zinc-600">Attr</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 z-[100] animate-in fade-in duration-300 backdrop-blur-xl" onClick={onClose} />
      
      <div className="fixed top-0 right-0 h-full w-full max-w-3xl bg-[#1C1B1F] z-[101] shadow-2xl md:rounded-l-[48px] animate-in slide-in-from-right duration-500 flex flex-col border-l border-white/5 overflow-hidden">
        <div className="w-full h-8 flex justify-center items-center mt-2 flex-shrink-0">
          <div className="w-16 h-1 bg-white/10 rounded-full" />
        </div>

        <div className="px-10 pb-6 flex justify-between items-center border-b border-white/5 pt-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors text-zinc-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{artifact.title}</h2>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#D0BCFF] font-black">{artifact.role}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <button className="p-3 rounded-full hover:bg-white/5 transition-colors text-zinc-400"><Share2 className="w-5 h-5" /></button>
            <button className="p-3 rounded-full hover:bg-white/5 transition-colors text-zinc-400"><Archive className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
          {renderProjection()}

          {artifact.type !== 'prototype' && (
            <div className="prose prose-invert max-w-none">
              <h4 className="text-[10px] font-black text-[#D0BCFF] uppercase tracking-[0.2em] mb-6 border-b border-white/5 pb-2">Analysis Log</h4>
              <div className="space-y-6 text-[#CAC4D0] leading-relaxed text-base font-light">
                {artifact.content.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={i} className="h-4" />;
                  if (trimmed.startsWith('•')) {
                    return (
                      <div key={i} className="flex gap-4 items-start pl-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D0BCFF] mt-2.5 flex-shrink-0 shadow-[0_0_8px_rgba(208,188,255,0.5)]" />
                        <span className="text-[#E6E1E5]">{trimmed.replace('•', '').trim()}</span>
                      </div>
                    );
                  }
                  return <p key={i} className="mb-4">{trimmed}</p>;
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-10 border-t border-white/5 bg-[#2B2930]/80 flex items-center justify-between backdrop-blur-2xl flex-shrink-0">
          <div className="flex gap-4">
             <button className="m3-button h-16 px-10 bg-[#D0BCFF] text-[#381E72] flex items-center gap-3 hover:elevation-3 transition-all hover:scale-[1.02] active:scale-95 shadow-[0_10px_40px_rgba(208,188,255,0.2)] group">
               <Zap className="w-5 h-5 group-hover:animate-bounce" />
               <span className="font-black text-sm uppercase tracking-widest">Validate Design</span>
             </button>
             <button onClick={handleCopy} className="m3-button h-16 px-8 bg-transparent border border-[#49454F] text-[#D0BCFF] flex items-center gap-3 hover:bg-[#D0BCFF]/5 transition-colors">
               {copied ? <CheckCircle className="w-5 h-5" /> : <CodeIcon className="w-5 h-5" />}
               <span className="font-bold text-sm uppercase tracking-widest">{copied ? 'Copied' : 'Inspect Code'}</span>
             </button>
          </div>
          <button className="p-4 text-zinc-600 hover:text-red-400 transition-colors"><Trash2 className="w-6 h-6" /></button>
        </div>
      </div>
    </>
  );
};

export default SideDrawer;
