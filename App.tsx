
import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Map as MapIcon, 
  LayoutGrid, 
  Settings, 
  History, 
  ArrowRight,
  Download,
  Zap,
  Target,
  BarChart3,
  Briefcase,
  Cpu,
  ShieldCheck,
  Search,
  MousePointer2
} from 'lucide-react';
import { PocketStore, Artifact, ProjectMode, ProjectDepth } from './types';
import { runDesignSolver, resolveAgents } from './services/pocketFlow';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import AppMapViewer from './components/AppMapViewer';
import DottedBackground from './components/DottedBackground';

const App: React.FC = () => {
  const [store, setStore] = useState<PocketStore>({
    idea_raw: '',
    mode: 'idea',
    depth: 'standard',
    artifacts: [],
    status: 'idle',
    currentStep: ''
  });

  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  
  const [activeMode, setActiveMode] = useState<ProjectMode>('idea');
  const [activeDepth, setActiveDepth] = useState<ProjectDepth>('standard');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setStore({
      idea_raw: inputValue,
      mode: activeMode,
      depth: activeDepth,
      status: 'analyzing',
      artifacts: [],
      currentStep: 'Initializing Experts...'
    });

    try {
      await runDesignSolver(inputValue, activeMode, activeDepth, (update) => {
        setStore(prev => ({ ...prev, ...update }));
      });
    } catch (err) {
      setStore(prev => ({ ...prev, status: 'error', currentStep: 'Expert system failure.' }));
    }
  };

  const isProcessing = store.status === 'analyzing' || store.status === 'designing';

  return (
    <div className="h-screen flex bg-[#09090b] text-[#E6E1E5] overflow-hidden font-sans">
      <DottedBackground />

      {/* Navigation Rail */}
      <nav className="w-20 md:w-24 border-r border-white/5 flex flex-col items-center py-8 gap-8 z-50 bg-[#09090b]">
        <div className="w-12 h-12 bg-[#D0BCFF] rounded-2xl flex items-center justify-center text-[#381E72] shadow-xl hover:scale-110 transition-transform">
          <Layers className="w-6 h-6" />
        </div>
        
        <div className="flex flex-col gap-6 flex-1 pt-12">
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex flex-col items-center gap-1 group p-2 transition-all ${viewMode === 'grid' ? 'text-[#D0BCFF]' : 'text-zinc-500'}`}
          >
            <div className={`p-3 rounded-full transition-all ${viewMode === 'grid' ? 'bg-[#4F378B]/40' : 'group-hover:bg-white/5'}`}>
              <LayoutGrid className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Deck</span>
          </button>
          
          <button 
            onClick={() => setViewMode('map')}
            className={`flex flex-col items-center gap-1 group p-2 transition-all ${viewMode === 'map' ? 'text-[#D0BCFF]' : 'text-zinc-500'}`}
          >
            <div className={`p-3 rounded-full transition-all ${viewMode === 'map' ? 'bg-[#4F378B]/40' : 'group-hover:bg-white/5'}`}>
              <MapIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Arch</span>
          </button>
        </div>

        <button className="p-3 text-zinc-500 hover:text-white transition-colors">
          <Settings className="w-6 h-6" />
        </button>
      </nav>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 px-10 flex justify-between items-center border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold tracking-tight text-[#E6E1E5] max-w-md truncate">
              {store.status === 'idle' ? 'Design Solver' : store.idea_raw}
            </h2>
            {store.status !== 'idle' && (
              <span className="px-4 py-1.5 bg-[#2B2930] text-[#D0BCFF] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#D0BCFF]/10 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-green-400'}`}></div>
                {store.status}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {store.status === 'ready' && (
              <button 
                className="m3-button h-11 px-6 bg-[#D0BCFF] text-[#381E72] flex items-center gap-2 hover:scale-[1.02] transition-all font-black text-xs uppercase tracking-widest shadow-lg"
              >
                <Download className="w-4 h-4" /> Export Spec
              </button>
            )}
            {store.status !== 'idle' && (
              <button 
                onClick={() => setStore({ idea_raw: '', mode: 'idea', depth: 'standard', artifacts: [], status: 'idle', currentStep: '' })}
                className="m3-button h-11 px-6 bg-[#2B2930] border border-[#49454F] text-[#CAC4D0] hover:bg-[#49454F]/20 transition-all font-black text-xs uppercase tracking-widest"
              >
                New Project
              </button>
            )}
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {store.status === 'idle' ? (
            <div className="max-w-4xl mx-auto mt-20 text-center space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#4F378B]/20 border border-[#D0BCFF]/20 rounded-full text-[#D0BCFF] text-[10px] font-black uppercase tracking-[0.3em] shadow-inner">
                  <Zap className="w-4 h-4 fill-[#D0BCFF]" /> PocketFlow Multi-Agent Solver
                </div>
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-[0.8]">
                  Design <span className="text-[#D0BCFF] italic">Solved.</span>
                </h1>
                <p className="text-xl text-[#CAC4D0] max-w-2xl mx-auto leading-relaxed font-light opacity-80">
                  Transform a simple intention into a fully realized product architecture, strategy, and interactive visual projection.
                </p>
              </div>

              {/* Agent Activation Matrix Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div className="flex flex-col gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 text-left px-2 flex items-center gap-2">
                    <Target className="w-3 h-3" /> Project Objective
                  </span>
                  <div className="grid grid-cols-3 bg-[#2B2930]/40 p-1.5 rounded-[24px] border border-white/5 backdrop-blur-sm">
                    {(['idea', 'mvp', 'scale'] as ProjectMode[]).map(m => (
                      <button 
                        key={m} 
                        onClick={() => setActiveMode(m)}
                        className={`py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === m ? 'bg-[#D0BCFF] text-[#381E72] shadow-xl' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 text-left px-2 flex items-center gap-2">
                    <Search className="w-3 h-3" /> Strategy Depth
                  </span>
                  <div className="grid grid-cols-3 bg-[#2B2930]/40 p-1.5 rounded-[24px] border border-white/5 backdrop-blur-sm">
                    {(['quick', 'standard', 'deep'] as ProjectDepth[]).map(d => (
                      <button 
                        key={d} 
                        onClick={() => setActiveDepth(d)}
                        className={`py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeDepth === d ? 'bg-[#D0BCFF] text-[#381E72] shadow-xl' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="relative group max-w-2xl mx-auto mt-12 pb-24">
                <div className="flex items-center bg-[#2B2930] rounded-[40px] p-2 pl-10 shadow-2xl transition-all border-2 border-transparent focus-within:border-[#D0BCFF]/50 focus-within:bg-[#1C1B1F] group-hover:scale-[1.01]">
                  <input
                    type="text"
                    placeholder="Describe your product vision..."
                    className="bg-transparent border-none outline-none flex-1 text-xl py-6 placeholder:text-zinc-700 text-white font-medium"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className="w-16 h-16 bg-[#D0BCFF] text-[#381E72] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    <ArrowRight className="w-8 h-8" />
                  </button>
                </div>
                <div className="mt-6 flex justify-center gap-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                   <span>{resolveAgents(activeMode, activeDepth).length} Specialist Agents Active</span>
                   <span>•</span>
                   <span>Full Visual Prototype Included</span>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in duration-700">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-16 mt-24">
                   <div className="relative flex items-center justify-center">
                      <div className="absolute w-64 h-64 border-[1px] border-[#D0BCFF]/10 rounded-full animate-[spin_15s_linear_infinite]" />
                      <div className="absolute w-52 h-52 border-[1px] border-[#D0BCFF]/30 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
                      <div className="relative w-36 h-36 rounded-full bg-[#1C1B1F] border-4 border-[#D0BCFF] shadow-[0_0_80px_rgba(208,188,255,0.4)] flex items-center justify-center">
                        <Sparkles className="w-14 h-14 text-[#D0BCFF] animate-pulse" />
                      </div>
                   </div>
                  <div className="text-center space-y-6">
                    <p className="text-[#D0BCFF] font-black tracking-[0.5em] uppercase text-[10px] animate-pulse">Neural Projection Pipeline</p>
                    <h3 className="text-5xl font-black text-white tracking-tight leading-tight">{store.currentStep}</h3>
                    <div className="flex gap-1 justify-center opacity-40">
                       {resolveAgents(store.mode, store.depth).map((_, i) => (
                         <div key={i} className={`w-8 h-1 rounded-full ${i < store.artifacts.length + 2 ? 'bg-[#D0BCFF]' : 'bg-white/10'}`} />
                       ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-7xl mx-auto space-y-16 pb-20">
                  {viewMode === 'map' ? (
                    <AppMapViewer map={store.app_map} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32">
                      {store.artifacts.map((artifact, index) => (
                        <ArtifactCard 
                          key={artifact.id}
                          artifact={artifact}
                          delay={index * 100}
                          onClick={() => setSelectedArtifact(artifact)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <SideDrawer 
        artifact={selectedArtifact} 
        onClose={() => setSelectedArtifact(null)} 
      />
    </div>
  );
};

export default App;
