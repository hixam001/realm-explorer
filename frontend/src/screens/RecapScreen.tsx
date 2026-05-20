import React, { useEffect } from 'react';
import { Skull, Star, Layers, Heart, Coins, Package, RotateCcw, Zap } from 'lucide-react';
import { useGameStore } from '../store';
import { CLASSES, PLAY_STYLE_TITLES } from '../data';
import { ThinkingPanel } from '../components/ThinkingPanel';
import { audioHaptics } from '../audio';
import { updateProfileAfterRun, loadProfile } from '../profileStorage';

const STYLE_GLOW: Record<string, string> = {
  aggressive: 'bg-red-400', diplomatic: 'bg-cyan-400',
  cautious: 'bg-amber-400', unpredictable: 'bg-purple-400',
};

export function RecapScreen() {
  const { run, isThinking, setThinking, resetRun, setActiveScreen, setProfile } = useGameStore(s => s);

  useEffect(() => {
    (async () => {
      setThinking(true, 'The chronicler writes your story...');
      await new Promise(r => setTimeout(r, 1400));
      setThinking(false);

      // ── Persist updated profile to localStorage ───────────────────────
      if (run) {
        const isWinLocal = run.status === 'completed';
        const floorsReached = isWinLocal ? 5 : Math.max(0, run.currentFloor - 1);
        const titlePool = PLAY_STYLE_TITLES[run.playStyle] ?? ['The Wanderer'];
        const earnedTitle = isWinLocal
          ? (titlePool[0] ?? 'The Wanderer')
          : (titlePool[titlePool.length - 1] ?? 'The Wanderer');

        const currentProfile = loadProfile();
        const updatedProfile = updateProfileAfterRun({
          currentProfile,
          floorsReached,
          playStyle:   run.playStyle,
          playerClass: run.playerClass,
          earnedTitle,
        });
        setProfile(updatedProfile);  // update store so HomeScreen sees it immediately
      }

      if (run?.status === 'completed') audioHaptics.chord();
      else audioHaptics.heavy();
    })();
  }, []);

  if (!run) return null;

  // ── Derive win/loss from run.status (set correctly in EncounterScreen) ───────
  const isWin       = run.status === 'completed';
  const cls         = CLASSES.find(c => c.id === run.playerClass);
  // Died ON floor N → cleared N-1. Retired AFTER floor N → cleared N.
  const floorsCleared = isWin ? run.currentFloor : Math.max(0, run.currentFloor - 1);
  const titlePool   = PLAY_STYLE_TITLES[run.playStyle] ?? ['The Wanderer'];
  const earnedTitle = isWin ? (titlePool[0] ?? 'The Wanderer') : (titlePool[titlePool.length - 1] ?? 'The Wanderer');
  const glowDot     = STYLE_GLOW[run.playStyle] ?? 'bg-gray-400';

  return (
    <div className="flex-1 bg-[#090F16] flex flex-col font-sans pt-safe pb-safe relative overflow-y-auto selection:bg-red-500/30 px-5">
      {isThinking && <ThinkingPanel />}

      {/* Red gradient overlay at top */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-red-950/30 to-transparent pointer-events-none" />

      <div className="w-full flex flex-col relative z-10 pt-6">

        {/* Icon */}
        <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-5 ${
          isWin
            ? 'bg-emerald-950/60 border border-emerald-900/50 shadow-[0_0_30px_rgba(5,150,105,0.3)]'
            : 'bg-red-950/60 border border-red-900/50 shadow-[0_0_30px_rgba(153,27,27,0.3)]'
        }`}>
          {isWin
            ? <Zap className="w-6 h-6 text-emerald-400" />
            : <Skull className="w-6 h-6 text-red-500/90" />
          }
        </div>

        {/* Result heading */}
        <h1 className={`text-3xl font-extrabold text-center mb-1 tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
          isWin ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {isWin ? 'Realm Conquered' : 'Fallen in the Dark'}
        </h1>
        <div className="text-[10px] font-mono text-gray-500 tracking-[0.2em] uppercase text-center mb-5">
          {cls?.name ?? 'Explorer'} · End of Run
        </div>

        {/* Earned title */}
        <div className="flex justify-center mb-5">
          <div className={`flex items-center space-x-1 text-[10px] px-3 py-1 rounded-full font-mono ${
            isWin
              ? 'border border-emerald-900/50 bg-emerald-950/20 text-emerald-400'
              : 'border border-red-900/50 bg-red-950/20 text-red-400'
          }`}>
            <Star className={`w-3 h-3 ${isWin ? 'text-emerald-500' : 'text-red-500'}`} />
            <span>{earnedTitle}</span>
          </div>
        </div>

        {/* Narrative */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 mb-4">
          <p className="text-[#94A3B8] font-mono text-[11px] leading-relaxed">
            {isWin
              ? `You descended as ${cls?.name}. The realm threw everything at you — automatons, rifts, colossi. You answered every challenge. The dungeon will remember your name for centuries.`
              : `You descended as ${cls?.name}. Floor ${run.currentFloor} was where the math caught up. But you fought beautifully.`
            }
          </p>
        </div>

        {/* 2×2 Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-[#475569] font-mono text-[8px] uppercase tracking-wider mb-2">
              <Layers className="w-3.5 h-3.5 text-gray-500" /> <span>FLOORS</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white leading-none">
              {floorsCleared}
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-[#475569] font-mono text-[8px] uppercase tracking-wider mb-2">
              <Heart className="w-3.5 h-3.5 text-red-900" /> <span>FINAL HP</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white leading-none">
              {run.hp} <span className="text-[#475569]">/ {run.maxHp}</span>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-[#475569] font-mono text-[8px] uppercase tracking-wider mb-2">
              <Coins className="w-3.5 h-3.5 text-yellow-600/50" /> <span>GOLD</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white leading-none">{run.gold}</div>
          </div>

          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center space-x-1.5 text-[#475569] font-mono text-[8px] uppercase tracking-wider mb-2">
              <Package className="w-3.5 h-3.5 text-gray-500" /> <span>ITEMS</span>
            </div>
            <div className="text-2xl font-bold font-mono text-white leading-none">{run.inventory.length}</div>
          </div>
        </div>

        {/* Play style */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <div className="font-mono text-[8px] text-[#475569] uppercase tracking-widest mb-1.5">DOMINANT PLAY STYLE</div>
            <div className="flex items-center font-bold text-white text-[13px]">
              <div className={`w-2.5 h-2.5 ${glowDot} rounded-full mr-2`} />
              <span className="capitalize">{run.playStyle}</span>
            </div>
          </div>
        </div>

        {/* Items carried */}
        {run.inventory.length > 0 && (
          <div className="mb-6">
            <div className="font-mono text-[8px] text-[#475569] uppercase tracking-widest mb-1.5 px-1">ITEMS CARRIED</div>
            <div className="flex flex-col space-y-2">
              {run.inventory.map((item, i) => (
                <div key={i} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3 pt-2.5 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded border border-[#1E293B] bg-[#090F16] flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-white font-bold text-[12px] leading-tight mb-0.5">{item.itemName}</h4>
                    <div className="text-gray-500 text-[9px] font-mono leading-tight">{item.itemEffect}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Play Again */}
        <button
          onClick={() => { audioHaptics.click(); resetRun(); setActiveScreen('home'); }}
          className="w-full bg-[#387478] hover:bg-cyan-700 text-white rounded-2xl py-5 flex justify-center items-center font-bold text-sm transition-all shadow-lg border border-cyan-500/20 mb-2">
          <RotateCcw className="w-3.5 h-3.5 mr-2 stroke-[2.5]" /> Play Again
        </button>
        <div className="text-center text-[9px] font-mono text-[#334155] tracking-wider mb-8 sm:mb-6">
          Resets all state · New run · New AI story
        </div>

      </div>
    </div>
  );
}
