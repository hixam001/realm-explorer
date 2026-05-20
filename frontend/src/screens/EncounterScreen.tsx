import React, { useState, useEffect, useRef } from 'react';
import { Coins, Layers, Skull, Swords, Shield, MessageCircle, Zap, ChevronRight, Heart } from 'lucide-react';
import { useGameStore } from '../store';
import { CLASSES, MOCK_ENCOUNTERS, MOCK_COMBAT_OUTCOMES, FLOOR_LOOT_ITEMS } from '../data';
import { ActionChoice } from '../types';
import { ThinkingPanel } from '../components/ThinkingPanel';
import { audioHaptics } from '../audio';

const ACTION_STYLE: Record<string, { border: string; bg: string; hover: string; text: string; icon: React.ReactNode }> = {
  aggressive:    { border: 'border-red-900/60',    bg: 'bg-red-950/20',    hover: 'hover:bg-red-950/30',    text: 'text-red-500',    icon: <Swords        className="w-3 h-3" /> },
  cautious:      { border: 'border-amber-900/60',  bg: 'bg-amber-950/20',  hover: 'hover:bg-amber-950/30',  text: 'text-amber-500',  icon: <Shield        className="w-3 h-3" /> },
  diplomatic:    { border: 'border-cyan-900/60',   bg: 'bg-cyan-950/20',   hover: 'hover:bg-cyan-950/30',   text: 'text-cyan-400',   icon: <MessageCircle className="w-3 h-3" /> },
  unpredictable: { border: 'border-purple-900/60', bg: 'bg-purple-950/20', hover: 'hover:bg-purple-950/30', text: 'text-purple-400', icon: <Zap           className="w-3 h-3" /> },
};

const ACTION_LABEL: Record<string, string> = {
  aggressive: 'ATTACK', cautious: 'DEFEND', diplomatic: 'PARLEY', unpredictable: 'TRICK',
};

const ENEMY_MAX_HP = 10;

export function EncounterScreen() {
  const { run, currentEncounter, isThinking,
    setThinking, setRun, appendAction, addEventLog,
    resetCombat, setCurrentEncounter, setActiveScreen } = useGameStore(s => s);

  const [turns, setTurns]         = useState(0);
  const [enemyHp, setEnemyHp]     = useState(ENEMY_MAX_HP);
  const [combatLogs, setCombatLogs] = useState<{ action: string; result: string; style: string }[]>([]);
  const [victory, setVictory]     = useState(false);
  const [lastDelta, setLastDelta] = useState<{ player: number; enemy: number } | null>(null);
  const logEnd = useRef<HTMLDivElement>(null);

  // Reset on new encounter
  useEffect(() => {
    if (currentEncounter) {
      setCombatLogs([]);
      setEnemyHp(ENEMY_MAX_HP);
      setTurns(0);
      setVictory(false);
      setLastDelta(null);
    }
  }, [currentEncounter]);

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [combatLogs]);

  const handleAction = async (choice: ActionChoice) => {
    if (victory || isThinking || !run || !currentEncounter) return;
    audioHaptics.click();
    setThinking(true, 'The Rival is resolving...');
    await new Promise(r => setTimeout(r, 700 + Math.random() * 400));

    const outcome = MOCK_COMBAT_OUTCOMES[Math.min(Math.floor(combatLogs.length / 2), MOCK_COMBAT_OUTCOMES.length - 1)];

    // ── Apply player HP delta ──────────────────────────────────
    const nextPlayerHp = Math.max(0, run.hp + outcome.playerHpDelta);
    // ── Apply enemy HP delta (THIS was missing before) ────────
    const nextEnemyHp  = Math.max(0, enemyHp + outcome.enemyHpDelta);

    appendAction(choice.style);
    setRun({ ...run, hp: nextPlayerHp });
    setEnemyHp(nextEnemyHp);
    setTurns(t => t + 1);
    setLastDelta({ player: outcome.playerHpDelta, enemy: outcome.enemyHpDelta });
    setCombatLogs(prev => [...prev, { action: choice.label, result: outcome.outcomeText, style: choice.style }]);
    setThinking(false);

    // Victory when enemy dies OR player used 3+ actions OR player HP = 0
    if (nextEnemyHp <= 0 || combatLogs.length >= 2 || nextPlayerHp <= 0) {
      setVictory(true);
      if (nextPlayerHp > 0) audioHaptics.chord(); else audioHaptics.heavy();
    }
  };

  const handleClaim = async () => {
    if (!run) return;
    audioHaptics.gold();
    setThinking(true, 'Loot Agent forging reward...');
    await new Promise(r => setTimeout(r, 900));
    // Cycle loot items with modulo so there's always a reward
    const loot = FLOOR_LOOT_ITEMS[(run.currentFloor - 1) % FLOOR_LOOT_ITEMS.length];
    addEventLog(`Received ${loot.itemName}`);
    setThinking(false);

    // ── Death: always go to recap ─────────────────────────────────────────
    if (run.hp <= 0) {
      setRun({ ...run, inventory: [...run.inventory, loot], status: 'died' });
      setThinking(true, 'Writing your epitaph...');
      await new Promise(r => setTimeout(r, 1000));
      setThinking(false);
      setActiveScreen('recap');
      return;
    }

    // ── Victory: +10 gold reward, then always go to merchant ────────────
    setRun({ ...run, inventory: [...run.inventory, loot], gold: run.gold + 10 });
    resetCombat(); setCombatLogs([]); setVictory(false); setLastDelta(null);
    setActiveScreen('merchant');
  };

  if (!run || !currentEncounter) return null;
  const playerHpPct = Math.max(0, (run.hp / run.maxHp) * 100);
  const enemyHpPct  = Math.max(0, (enemyHp / ENEMY_MAX_HP) * 100);

  return (
    <div className="flex-1 bg-[#090F16] flex flex-col font-sans">
      {isThinking && <ThinkingPanel />}

      {/* ── Status Header ── */}
      <div className="px-5 pb-4 pt-safe bg-[#090F16] border-b border-[#1E293B] shrink-0 z-10">

        {/* Floor number + turn — infinite, no cap */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded-xl">
              <Layers className="w-3.5 h-3.5 text-cyan-600" />
              <span className="font-mono text-xs font-bold text-white tracking-wider">FLOOR {run.currentFloor}</span>
            </div>
            <div className="flex gap-0.5">
              {[...Array(Math.min(run.currentFloor, 8))].map((_, i) => (
                <div key={i} className={`h-1.5 w-1.5 rounded-full ${
                  i < run.currentFloor ? 'bg-cyan-500' : 'bg-[#1E293B]'
                }`} />
              ))}
              {run.currentFloor > 8 && (
                <span className="text-cyan-600 font-mono text-[9px] ml-0.5 leading-none self-end">+</span>
              )}
            </div>
          </div>
          <span className="font-mono text-[10px] text-[#475569] tracking-widest">TURN {turns}</span>
        </div>

        {/* Player HP row */}
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-red-500" />
            <span className="font-mono text-[9px] text-[#475569] uppercase tracking-widest">YOUR HP</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Damage flash */}
            {lastDelta?.player !== undefined && lastDelta.player !== 0 && (
              <span className={`font-mono text-[10px] font-bold ${lastDelta.player < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {lastDelta.player > 0 ? '+' : ''}{lastDelta.player}
              </span>
            )}
            <span className="font-mono text-sm font-bold text-white">
              {run.hp} <span className="text-[#475569] font-normal text-xs">/ {run.maxHp}</span>
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-[#1E293B] rounded-full overflow-hidden mb-3">
          <div className="h-full bg-red-400 rounded-full transition-all duration-500" style={{ width: `${playerHpPct}%` }} />
        </div>

        {/* Gold */}
        <div className="flex justify-end">
          <div className="flex items-center gap-1 text-yellow-500 font-mono text-[11px] border border-yellow-900/50 bg-yellow-950/20 px-2.5 py-1 rounded-full font-bold">
            <Coins className="w-3 h-3" /> <span>{run.gold}</span>
          </div>
        </div>
      </div>

      {/* ── Enemy Card ── */}
      <div className="px-5 pt-3 pb-2 shrink-0">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl px-4 py-3">
          {/* Enemy info row */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-950 flex items-center justify-center border border-red-900/40 shrink-0">
                <Skull className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-[15px] leading-tight">{currentEncounter.enemyName}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[8px] text-red-400 border border-red-900/40 bg-red-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    {currentEncounter.enemyType}
                  </span>
                  <span className="font-mono text-[8px] text-yellow-500 flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" /> LV.{currentEncounter.difficultyWeight}
                  </span>
                </div>
              </div>
            </div>

            {/* Enemy HP number — now live */}
            <div className="text-right">
              <div className="font-mono text-[9px] text-[#475569] uppercase tracking-widest mb-0.5">ENEMY HP</div>
              <div className="font-mono text-sm font-bold">
                <span className={enemyHp <= 3 ? 'text-red-400' : 'text-orange-400'}>{enemyHp}</span>
                <span className="text-[#475569] text-xs font-normal"> / {ENEMY_MAX_HP}</span>
              </div>
            </div>
          </div>

          {/* Enemy HP bar — animates on hit */}
          <div className="h-2 w-full bg-[#050B14] rounded-full overflow-hidden border border-[#1E293B]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${enemyHpPct}%`,
                background: enemyHpPct > 40
                  ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                  : 'linear-gradient(90deg, #7f1d1d, #dc2626)',
                boxShadow: enemyHpPct > 0 ? '0 0 8px rgba(239,68,68,0.4)' : 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Scrolling Narrative ── */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-5">
        <p className="text-[13px] leading-relaxed text-[#94A3B8]">{currentEncounter.narrativeText}</p>

        {combatLogs.map((log, i) => (
          <div key={i} className="border-l-2 border-[#1E293B] pl-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
              <span className="text-red-400 font-mono text-[10px] font-bold tracking-wide">YOU: {log.action}</span>
            </div>
            <p className="text-[13px] text-[#94A3B8] leading-relaxed">{log.result}</p>
          </div>
        ))}
        <div ref={logEnd} />
      </div>

      {/* ── Footer Controls ── */}
      <div className="px-5 pt-3 pb-safe bg-[#090F16] border-t border-[#1E293B] shrink-0 relative z-10">
        {victory ? (
          <button
            onClick={handleClaim}
            disabled={isThinking}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl py-5 flex justify-center items-center gap-2.5 font-sans text-sm shadow-[0_0_20px_rgba(5,150,105,0.2)] disabled:opacity-50 transition-colors mb-3">
            <Swords className="w-4 h-4" /> {run.hp <= 0 ? 'View Run Recap' : 'Claim Victory & Continue'}
          </button>
        ) : (
          <div className="flex flex-col gap-2.5 mb-3">
            {currentEncounter.availableActions.map((choice) => {
              const s = ACTION_STYLE[choice.style] ?? ACTION_STYLE.cautious;
              return (
                <button
                  key={choice.label}
                  onClick={() => handleAction(choice)}
                  disabled={isThinking}
                  className={`w-full flex justify-between items-center border ${s.border} ${s.bg} ${s.hover} rounded-2xl px-5 py-5 transition-colors disabled:opacity-40`}
                >
                  <span className="text-white font-bold text-sm">{choice.label}</span>
                  <div className={`flex items-center gap-1.5 ${s.text} font-mono text-[10px] font-bold shrink-0`}>
                    {s.icon} <span>{ACTION_LABEL[choice.style]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* DM Reasoning */}
        <div className="flex justify-between items-center pb-1">
          <span className="text-[#334155] font-mono text-[8px] uppercase tracking-widest flex items-center gap-1">
            <div className="w-1.5 h-2 bg-cyan-900 rounded-sm" /> DM REASONING ACTIVE
          </span>
          <ChevronRight className="w-3 h-3 text-[#334155]" />
        </div>
      </div>
    </div>
  );
}
