
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  Map as MapIcon, 
  LayoutGrid, 
  Settings, 
  History, 
  ArrowRight,
  Download,
  Zap
} from 'lucide-react';
import { PocketStore, Artifact } from './types';
import { runDesignSolver } from './services/pocketFlow';
import ArtifactCard from './components/ArtifactCard';
import SideDrawer from './components/SideDrawer';
import AppMapViewer from './components/AppMapViewer';
import DottedBackground from './components/DottedBackground';

/**
 * App Orchestrator Component
 * Manages the global state and UI routing for the Design Solver.
 */

const App: React.FC = () => {
  const [store, setStore] = useState<PocketStore>({
    idea_raw: '',
    artifacts: [],
    status: 'idle',
    currentStep: ''
  });

  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Reset store and initiate Service Layer
    setStore({
      idea_raw: inputValue,
      status: 'analyzing',
      artifacts: [],
      currentStep: 'Initializing Experts...'
    });

    try {
      await runDesignSolver(inputValue, (update) => {
        setStore(prev => ({ ...prev, ...update }));
      });
    } catch (err) {
      console.error(err);
      setStore(prev => ({ ...prev, status: 'error', currentStep: 'Expert system failure.' }));
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(store, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `project_design_${store.idea_raw.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const isProcessing = store.status === 'analyzing' || store.status === 'designing';

  return (
    <div className="h-screen flex bg-[#1C1B1F] text-[#E6E1E5] overflow-hidden">
      <DottedBackground />

      {/* Navigation Rail */}
      <nav className="w-20 md:w-24 border-r border-white/5 flex flex-col items-center py-8 gap-8 z-50 bg-[#1C1B1F]">
        <div className="w-12 h-12 bg-[#D0BCFF] rounded-2xl flex items-center justify-center text-[#381E72] shadow-lg animate-in zoom-in duration-500">
          <Layers className="w-6 h-6" />
        </div>
        
        <div className="flex flex-col gap-4 flex-1">
          <button 
            onClick={() => setViewMode('grid')}
            className={`flex flex-col items-center gap-1 group p-2 transition-all ${viewMode === 'grid' ? 'text-[#D0BCFF]' : 'text-zinc-500'}`}
          >
            <div className={`p-2 rounded-full transition-all ${viewMode === 'grid' ? 'bg-[#4F378B]' : 'group-hover:bg-white/5'}`}>
              <LayoutGrid className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-tighter">Deck</span>
          </button>
          
          <button 
            onClick={() => setViewMode('map')}
            className={`flex flex-col items-center gap-1 group p-2 transition-all ${viewMode === 'map' ? 'text-[#D0BCFF]' : 'text-zinc-500'}`}
          >
            <div className={`p-2 rounded-full transition-all ${viewMode === 'map' ? 'bg-[#4F378B]' : 'group-hover:bg-white/5'}`}>
              <MapIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-tighter">Architecture</span>
          </button>

          <button className="flex flex-col items-center gap-1 group p-2 text-zinc-500 opacity-20 cursor-not-allowed">
            <div className="p-2 rounded-full">
              <History className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium uppercase tracking-tighter">History</span>
          </button>
        </div>

        <button className="p-3 text-zinc-500 hover:text-white transition-colors">
          <Settings className="w-6 h-6" />
        </button>
      </nav>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* App Bar */}
        <header className="h-20 px-10 flex justify-between items-center border-b border-white/5 bg-[#1C1B1F]/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-bold tracking-tight text-[#E6E1E5] max-w-md truncate">
              {store.status === 'idle' ? 'Design Solver' : store.idea_raw}
            </h2>
            {store.status !== 'idle' && (
              <span className="px-4 py-1.5 bg-[#2B2930] text-[#D0BCFF] text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-[#D0BCFF]/10 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]'}`}></div>
                {store.status}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {store.status === 'ready' && (
              <button 
                onClick={handleExport}
                className="m3-button h-11 px-6 bg-[#D0BCFF] text-[#381E72] flex items-center gap-2 hover:scale-[1.02] transition-all font-black text-xs uppercase tracking-widest shadow-lg"
              >
                <Download className="w-4 h-4" /> Export Project
              </button>
            )}
            {store.status !== 'idle' && (
              <button 
                onClick={() => setStore({ idea_raw: '', artifacts: [], status: 'idle', currentStep: '' })}
                className="m3-button h-11 px-6 bg-[#2B2930] border border-[#49454F] text-[#CAC4D0] hover:bg-[#49454F]/20 transition-all font-black text-xs uppercase tracking-widest"
              >
                Reset
              </button>
            )}
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {store.status === 'idle' ? (
            <div className="max-w-4xl mx-auto mt-24 text-center space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#4F378B]/20 border border-[#D0BCFF]/20 rounded-full text-[#D0BCFF] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                  <Zap className="w-4 h-4" /> Autonomous Expert Team
                </div>
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter text-white leading-[0.8] animate-in slide-in-from-top-4 duration-700">
                  Concept <span className="text-[#D0BCFF]">Live.</span>
                </h1>
                <p className="text-xl text-[#CAC4D0] max-w-2xl mx-auto leading-relaxed font-light">
                  Input an intention. Receive architectural maps, specialized strategies, and three high-fidelity visual prototypes instantly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="relative group max-w-2xl mx-auto">
                <div className="flex items-center bg-[#2B2930] rounded-[32px] p-2 pl-8 shadow-2xl transition-all border-2 border-transparent focus-within:border-[#D0BCFF]/50 focus-within:bg-[#1C1B1F] group-hover:scale-[1.01]">
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
                    className="w-16 h-16 bg-[#D0BCFF] text-[#381E72] rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(208,188,255,0.3)]"
                  >
                    <ArrowRight className="w-8 h-8" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in duration-700">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-12 mt-24">
                   <div className="relative flex items-center justify-center">
                      <div className="absolute w-48 h-48 border-[1px] border-[#D0BCFF]/20 rounded-full animate-[spin_10s_linear_infinite]" />
                      <div className="absolute w-40 h-40 border-[1px] border-[#D0BCFF]/40 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
                      <div className="relative w-32 h-32 rounded-full bg-[#1C1B1F] border-4 border-[#D0BCFF] shadow-[0_0_60px_rgba(208,188,255,0.4)] flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-[#D0BCFF] animate-pulse" />
                      </div>
                   </div>
                  <div className="text-center space-y-4">
                    <p className="text-[#D0BCFF] font-black tracking-[0.4em] uppercase text-[10px] animate-pulse">Neural Projection Engine</p>
                    <h3 className="text-5xl font-black text-white tracking-tight">{store.currentStep}</h3>
                  </div>
                </div>
              ) : (
                <div className="max-w-7xl mx-auto space-y-16 pb-20">
                  {viewMode === 'map' ? (
                    <AppMapViewer map={store.app_map} />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
