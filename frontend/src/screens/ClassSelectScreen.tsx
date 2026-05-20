import React from 'react';
import { ArrowLeft, Swords, Flame, Eye, Heart, Sparkles, Coins, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store';
import { CLASSES, MOCK_ENCOUNTERS } from '../data';
import { CharacterClass } from '../types';
import { ThinkingPanel } from '../components/ThinkingPanel';
import { audioHaptics } from '../audio';

const CLASS_ICON: Record<string, React.ReactNode> = {
  blade_dancer: <Swords className="w-5 h-5" />,
  ember_mage:   <Flame  className="w-5 h-5" />,
  shadow_rogue: <Eye    className="w-5 h-5" />,
};

const CLASS_STYLE: Record<string, { icon: string; badge: string; spark: string; tag: string }> = {
  blade_dancer: { icon: 'bg-red-950 text-red-500 border border-red-900/30',       badge: 'bg-red-950/60 text-red-400 border-red-900/50',    spark: 'text-red-400',    tag: 'AGGRESSIVE'    },
  ember_mage:   { icon: 'bg-amber-950 text-amber-500 border border-amber-900/30', badge: 'bg-amber-950/60 text-amber-400 border-amber-900/50', spark: 'text-amber-400', tag: 'UNPREDICTABLE'  },
  shadow_rogue: { icon: 'bg-purple-950 text-purple-400 border border-purple-900/30', badge: 'bg-purple-950/60 text-purple-400 border-purple-900/50', spark: 'text-purple-400', tag: 'CAUTIOUS' },
};

export function ClassSelectScreen() {
  const { setActiveScreen, setRun, setCurrentEncounter, setThinking, isThinking } = useGameStore();

  const startGame = async (cls: CharacterClass) => {
    audioHaptics.chord();
    setThinking(true, 'Initializing run...');
    await new Promise(r => setTimeout(r, 600));
    setRun({
      runId: `run_${Math.random().toString(36).slice(2, 10)}`,
      playerId: 'explorer_01', playerClass: cls.id,
      hp: cls.startingHp, displayHp: cls.startingHp, maxHp: cls.maxHp,
      gold: cls.startingGold, currentFloor: 1, playStyle: cls.playStyle,
      actionHistory: [], eventLog: [], inventory: [], status: 'active',
    });
    setThinking(true, 'The DM is conjuring Floor 1...');
    await new Promise(r => setTimeout(r, 1000));
    setCurrentEncounter(MOCK_ENCOUNTERS[0]);
    setThinking(false);
    setActiveScreen('encounter');
  };

  return (
    <div className="flex-1 bg-[#090F16] flex flex-col">
      {isThinking && <ThinkingPanel />}

      {/* Header */}
      <div className="px-4 pb-3 pt-safe border-b border-[#1E293B] shrink-0 flex items-center space-x-3 bg-[#090F16] z-10">
        <button
          onClick={() => { audioHaptics.click(); setActiveScreen('home'); }}
          className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center border border-[#1E293B]">
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-white font-bold text-lg leading-tight">Choose Your Class</h2>
          <div className="font-mono text-[9px] text-gray-500 tracking-widest uppercase mt-0.5">FLOOR 1 OF 5</div>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <p className="text-gray-400 text-xs mb-1">
          Your class shapes how the Dungeon Master builds every floor. Choose carefully.
        </p>

        {CLASSES.map((cls) => {
          const s = CLASS_STYLE[cls.id];
          return (
            <button
              key={cls.id}
              onClick={() => startGame(cls)}
              disabled={isThinking}
              className="w-full text-left bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 relative hover:border-[#334155] transition-colors disabled:opacity-50"
            >
              {/* Header row */}
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.icon}`}>
                    {CLASS_ICON[cls.id]}
                  </div>
                  <div className="flex flex-col items-start">
                    <h3 className="text-white font-bold text-base leading-none mb-1.5">{cls.name}</h3>
                    <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-full border leading-none font-bold ${s.badge}`}>
                      {s.tag}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-gray-400 font-mono text-[10px]">
                  <Heart className="w-3 h-3 text-red-600/80" />
                  <span className="font-bold text-white">{cls.startingHp} <span className="text-gray-500 font-normal">HP</span></span>
                </div>
              </div>

              {/* Description */}
              <p className="text-[#64748B] text-[11px] mb-2 leading-relaxed">{cls.description}</p>

              {/* Lore */}
              <p className="text-[#475569] italic text-[11px] mb-3 font-serif">"{cls.lore}"</p>

              {/* Ability */}
              <div className="bg-[#090F16] border border-[#1E293B] rounded-xl p-2.5 mb-2.5 flex space-x-2">
                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${s.spark}`} />
                <p className="text-[10px] text-gray-400 leading-tight">
                  <span className={`font-mono font-bold mr-1 ${s.spark}`}>{cls.ability}:</span>
                  {cls.abilityDesc}
                </p>
              </div>

              {/* Gold */}
              <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 font-mono">
                <Coins className="w-3.5 h-3.5 text-yellow-500/80" />
                <span>Starting gold: <span className="text-yellow-500 font-bold">{cls.startingGold}</span></span>
              </div>
            </button>
          );
        })}
        <div className="pb-4" />
      </div>

      {/* Footer hint */}
      <div className="p-4 pb-safe bg-[#090F16] border-t border-[#1E293B] text-center shrink-0">
        <div className="py-3 rounded-xl border border-[#1E293B] bg-[#0F172A] font-mono text-[11px] font-semibold text-[#64748B]">
          ↑ Select a class to begin ↑
        </div>
      </div>
    </div>
  );
}
