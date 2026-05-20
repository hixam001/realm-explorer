import React, { useState, useEffect, useRef } from 'react';
import { Coins, Layers, Skull, Swords, Shield, MessageCircle, Zap, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store';
import { CLASSES, MOCK_ENCOUNTERS, MOCK_COMBAT_OUTCOMES, FLOOR_LOOT_ITEMS } from '../data';
import { ActionChoice } from '../types';
import { ThinkingPanel } from '../components/ThinkingPanel';
import { audioHaptics } from '../audio';

const ACTION_STYLE: Record<string, { border: string; bg: string; hover: string; text: string; icon: React.ReactNode }> = {
  aggressive:    { border: 'border-red-900/60',    bg: 'bg-red-950/20',    hover: 'hover:bg-red-950/30',    text: 'text-red-500',    icon: <Swords         className="w-3 h-3" /> },
  cautious:      { border: 'border-amber-900/60',  bg: 'bg-amber-950/20',  hover: 'hover:bg-amber-950/30',  text: 'text-amber-500',  icon: <Shield         className="w-3 h-3" /> },
  diplomatic:    { border: 'border-cyan-900/60',   bg: 'bg-cyan-950/20',   hover: 'hover:bg-cyan-950/30',   text: 'text-cyan-400',   icon: <MessageCircle  className="w-3 h-3" /> },
  unpredictable: { border: 'border-purple-900/60', bg: 'bg-purple-950/20', hover: 'hover:bg-purple-950/30', text: 'text-purple-400', icon: <Zap            className="w-3 h-3" /> },
};

const ACTION_LABEL: Record<string, string> = {
  aggressive: 'ATTACK', cautious: 'DEFEND', diplomatic: 'PARLEY', unpredictable: 'TRICK',
};

export function EncounterScreen() {
  const { run, currentEncounter, isThinking, combatLog, combatOver, playerWon,
    setThinking, setRun, appendAction, addEventLog, appendCombatLog,
    setCombatLog, setCombatOver, resetCombat, setCurrentEncounter, setActiveScreen } = useGameStore(s => s);

  const [turns, setTurns]     = useState(0);
  const [enemyHp, setEnemyHp] = useState(10);
  const [combatLogs, setCombatLogs] = useState<{action: string; result: string; style: string}[]>([]);
  const [victory, setVictory] = useState(false);
  const logEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentEncounter) { setCombatLogs([]); setEnemyHp(10); setTurns(0); setVictory(false); }
  }, [currentEncounter]);

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [combatLogs]);

  const handleAction = async (choice: ActionChoice) => {
    if (victory || isThinking || !run || !currentEncounter) return;
    audioHaptics.click();
    setThinking(true, 'The Rival is resolving...');
    await new Promise(r => setTimeout(r, 700 + Math.random() * 400));

    const outcome = MOCK_COMBAT_OUTCOMES[Math.min(Math.floor(combatLogs.length / 2), MOCK_COMBAT_OUTCOMES.length - 1)];
    const nextHp  = Math.max(0, run.hp + outcome.playerHpDelta);
    appendAction(choice.style);
    setRun({ ...run, hp: nextHp, gold: run.gold + (outcome.playerHpDelta < 0 ? 0 : 5) });
    setCombatLogs(prev => [...prev, { action: choice.label, result: outcome.outcomeText, style: choice.style }]);
    setThinking(false);

    if (combatLogs.length >= 2 || nextHp <= 0) {
      setVictory(true);
      if (nextHp > 0) audioHaptics.chord(); else audioHaptics.heavy();
    }
  };

  const handleClaim = async () => {
    if (!run) return;
    audioHaptics.gold();
    setThinking(true, 'Loot Agent forging reward...');
    await new Promise(r => setTimeout(r, 900));
    const loot = FLOOR_LOOT_ITEMS[Math.min(run.currentFloor - 1, FLOOR_LOOT_ITEMS.length - 1)];
    addEventLog(`Received ${loot.itemName}`);
    setThinking(false);

    if (run.currentFloor >= 4) {
      setRun({ ...run, inventory: [...run.inventory, loot], status: 'completed' });
      setThinking(true, 'Writing your legend...');
      await new Promise(r => setTimeout(r, 1200));
      setThinking(false); setActiveScreen('recap'); return;
    }
    if (run.currentFloor === 3) {
      setRun({ ...run, inventory: [...run.inventory, loot], currentFloor: 4 });
      setActiveScreen('merchant'); return;
    }
    const next = run.currentFloor + 1;
    setRun({ ...run, inventory: [...run.inventory, loot], currentFloor: next });
    resetCombat(); setCombatLogs([]); setVictory(false);
    setThinking(true, `DM building Floor ${next}...`);
    await new Promise(r => setTimeout(r, 900));
    const enc = MOCK_ENCOUNTERS[Math.min(next - 1, MOCK_ENCOUNTERS.length - 1)];
    setCurrentEncounter(enc); setEnemyHp(10); setTurns(0);
    setThinking(false);
  };

  if (!run || !currentEncounter) return null;
  const hpPct = (run.hp / run.maxHp) * 100;

  return (
    <div className="flex-1 bg-[#090F16] flex flex-col font-sans">
      {isThinking && <ThinkingPanel />}

      {/* ── Status Header ── */}
      <div className="px-4 pb-4 pt-safe bg-[#090F16] border-b border-[#1E293B] shrink-0 z-10">
        {/* Floor / Turn */}
        <div className="flex justify-between items-center text-[10px] font-mono mb-1.5 text-gray-500">
          <span className="tracking-widest flex items-center">
            <Layers className="w-3 h-3 mr-1 text-[#475569]" /> FLOOR {run.currentFloor} / 5
          </span>
          <span>Turn {turns}</span>
        </div>

        {/* Segmented floor bars */}
        <div className="flex space-x-1 mb-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= run.currentFloor ? 'bg-cyan-600' : 'bg-[#1E293B]'}`} />
          ))}
        </div>

        {/* HP + Gold */}
        <div className="flex justify-between items-end">
          <div className="font-mono flex flex-col">
            <span className="text-[9px] text-[#475569] uppercase tracking-widest leading-none mb-1">YOUR HP</span>
            <span className="text-red-400 font-bold text-sm leading-none">
              {run.hp} <span className="text-[#475569]">/ {run.maxHp}</span>
            </span>
          </div>
          <div className="flex items-center space-x-1 text-yellow-500 font-mono text-[11px] border border-yellow-900/50 bg-[#282110] px-2.5 py-1 rounded-full font-bold">
            <Coins className="w-3 h-3" /> <span>{run.gold}</span>
          </div>
        </div>

        {/* HP bar */}
        <div className="h-1.5 w-full bg-[#1E293B] rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-red-400 rounded-full transition-all duration-500" style={{ width: `${hpPct}%` }} />
        </div>
      </div>

      {/* ── Enemy Badge ── */}
      <div className="px-4 mt-3 shrink-0">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-t-xl rounded-b px-3 pt-2.5 pb-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-950 flex items-center justify-center border border-red-900/40 shrink-0">
                <Skull className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-white font-bold text-sm leading-none mb-1.5">{currentEncounter.enemyName}</h3>
                <div className="flex items-center space-x-1.5 text-[8px] font-mono text-gray-500 tracking-wider font-bold">
                  <span className="text-red-400 border border-red-900/40 bg-red-950/40 px-1 py-0.5 rounded uppercase">
                    {currentEncounter.enemyType}
                  </span>
                  <span>·</span>
                  <span className="flex items-center text-yellow-500">
                    <Zap className="w-2.5 h-2.5 mr-0.5" /> LV.{currentEncounter.difficultyWeight}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-red-500 font-mono text-xs font-bold leading-none mt-1">
              {enemyHp}<span className="text-red-900">/10</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-[#050B14] rounded-full overflow-hidden mt-1 relative border border-[#1E293B]">
            <div className="h-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] border-r border-[#090F16]"
              style={{ width: `${(enemyHp / 10) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* ── Scrolling Narrative ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-[13px] text-gray-300">
        <p className="leading-relaxed text-[#94A3B8]">{currentEncounter.narrativeText}</p>

        {combatLogs.map((log, i) => (
          <div key={i} className="pt-1">
            <div className="text-red-400 font-mono text-[11px] font-bold mb-1.5 flex items-start">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 mt-1 mr-2 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
              <span>&gt; You: {log.action}</span>
            </div>
            <p className="text-[#94A3B8] leading-relaxed">{log.result}</p>
          </div>
        ))}
        <div ref={logEnd} />
      </div>

      {/* ── Footer Controls ── */}
      <div className="p-4 sm:p-3 bg-[#090F16] border-t border-[#1E293B] shrink-0 pb-safe relative z-10">
        {victory ? (
          <button
            onClick={handleClaim}
            disabled={isThinking}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl py-3 flex justify-center items-center font-mono uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(5,150,105,0.2)] disabled:opacity-50 transition-colors">
            <Swords className="w-4 h-4 mr-2" /> {run.hp <= 0 ? 'View Run Recap' : 'Claim Victory'}
          </button>
        ) : (
          <div className="flex flex-col space-y-2">
            {currentEncounter.availableActions.map((choice) => {
              const s = ACTION_STYLE[choice.style] ?? ACTION_STYLE.cautious;
              return (
                <button
                  key={choice.label}
                  onClick={() => handleAction(choice)}
                  disabled={isThinking}
                  className={`w-full flex justify-between items-center border ${s.border} ${s.bg} ${s.hover} rounded-full px-5 py-3.5 transition-colors disabled:opacity-40`}
                >
                  <span className="text-white font-bold text-sm tracking-wide">{choice.label}</span>
                  <div className={`flex items-center space-x-1.5 ${s.text} font-mono text-[10px] font-bold shrink-0`}>
                    {s.icon} <span>{ACTION_LABEL[choice.style]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* DM Reasoning footer */}
        <div className="pt-2 flex justify-between items-center">
          <span className="text-[#475569] font-mono text-[8px] uppercase tracking-widest flex items-center">
            <div className="w-1.5 h-2 bg-cyan-700 mr-1.5 rounded-sm" /> DM REASONING
          </span>
          <ChevronRight className="w-3 h-3 text-[#475569] rotate-90" />
        </div>
      </div>
    </div>
  );
}
