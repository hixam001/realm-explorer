import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Coins, Package, ChevronRight, Heart, LogOut } from 'lucide-react';
import { useGameStore } from '../store';
import { MERCHANT_ITEMS, MOCK_ENCOUNTERS } from '../data';
import { GameItem, RunState } from '../types';
import { ThinkingPanel } from '../components/ThinkingPanel';
import { ItemCard } from '../components/ItemCard';
import { audioHaptics } from '../audio';

const BG = '#090F16'; const CARD = '#0F172A'; const DEEP = '#050B14'; const BORDER = '#1E293B';

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max));
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: DEEP, border: `1px solid ${BORDER}` }}>
      <motion.div
        className="h-full rounded-full"
        animate={{ width: `${pct * 100}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 6px ${color}50` }}
      />
    </div>
  );
}

// ── Item effect engine ────────────────────────────────────────────────────────
function applyItemEffect(run: RunState, item: GameItem): RunState {
  const fx = item.itemEffect.toLowerCase();

  const hpMatch = fx.match(/\+(\d+)\s*hp/);
  if (hpMatch) {
    const heal = parseInt(hpMatch[1], 10);
    return { ...run, hp: Math.min(run.maxHp, run.hp + heal) };
  }

  const shieldMatch = fx.match(/\+(\d+)\s*shield/);
  if (shieldMatch) {
    const shield = parseInt(shieldMatch[1], 10);
    return { ...run, maxHp: run.maxHp + shield, hp: run.hp + shield };
  }

  if (fx.includes('immune')) {
    return { ...run, eventLog: [...run.eventLog, '__IMMUNE_NEXT_HIT__'] };
  }

  return run;
}

function effectSummary(item: GameItem): string {
  const fx = item.itemEffect.toLowerCase();
  const hp = fx.match(/\+(\d+)\s*hp/);
  if (hp) return `+${hp[1]} HP restored`;
  const sh = fx.match(/\+(\d+)\s*shield/);
  if (sh) return `+${sh[1]} shield added`;
  if (fx.includes('immune')) return 'Next hit blocked';
  return 'Added to inventory';
}

export function MerchantScreen() {
  const { run, isThinking, setThinking, setRun, setCurrentEncounter,
    setCombatLog, setActiveScreen, addEventLog } = useGameStore(s => s);

  const [items, setItems]         = useState<GameItem[]>([]);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());
  const [toast, setToast]         = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setThinking(true, 'The merchant arranges their wares...');
      await new Promise(r => setTimeout(r, 900));
      setItems(MERCHANT_ITEMS);
      setThinking(false);
    })();
  }, []);

  const handleBuy = (item: GameItem) => {
    // Always read the freshest run from the store — avoids stale-closure
    // issues when the merchant mounts right after a setRun call in EncounterScreen.
    const freshRun = useGameStore.getState().run;
    if (!freshRun) return;

    const cost = typeof item.cost === 'number' && item.cost > 0 ? item.cost : 10;
    if (freshRun.gold < cost) return;

    audioHaptics.gold();
    const afterEffect = applyItemEffect({ ...freshRun, gold: freshRun.gold - cost }, item);
    setRun({ ...afterEffect, inventory: [...afterEffect.inventory, item] });
    addEventLog(`Purchased ${item.itemName} for ${cost} gold`);
    setPurchased(prev => new Set([...prev, item.itemName]));

    setToast(`${item.itemName}: ${effectSummary(item)} · −${cost} gold`);
    setTimeout(() => setToast(null), 2500);
  };

  // ── Continue: increment floor, cycle encounters with modulo ──────────────
  const handleContinue = async () => {
    const freshRun = useGameStore.getState().run;
    if (!freshRun) return;
    audioHaptics.click();
    const nextFloor = freshRun.currentFloor + 1;
    setThinking(true, `DM generating Floor ${nextFloor}...`);
    await new Promise(r => setTimeout(r, 1100));
    const encIndex = (nextFloor - 1) % MOCK_ENCOUNTERS.length;
    const enc = MOCK_ENCOUNTERS[encIndex];
    setCurrentEncounter(enc);
    setCombatLog([{ type: 'narrative', text: enc.narrativeText }]);
    setRun({ ...freshRun, currentFloor: nextFloor });
    setThinking(false);
    setActiveScreen('encounter');
  };

  // ── Retire: end the run gracefully with status 'completed' ───────────────
  const handleRetire = async () => {
    const freshRun = useGameStore.getState().run;
    if (!freshRun) return;
    audioHaptics.heavy();
    setThinking(true, 'Writing your legend...');
    await new Promise(r => setTimeout(r, 1200));
    setRun({ ...freshRun, status: 'completed' });
    setThinking(false);
    setActiveScreen('recap');
  };

  if (!run) return null;
  const nextFloor = run.currentFloor + 1;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: BG }}>
      {isThinking && <ThinkingPanel />}

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-4 right-4 z-50 bg-emerald-900/90 border border-emerald-700/60 rounded-xl px-4 py-2.5 text-emerald-300 font-mono text-[11px] font-bold text-center"
          >
            ✓ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="shrink-0 px-5 pt-safe pb-4" style={{ background: 'rgba(5,11,20,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#78350f,#d97706)', boxShadow: '0 0 16px rgba(217,119,6,0.3)' }}>
              <ShoppingBag size={16} className="text-amber-200" />
            </div>
            <div>
              <h2 className="font-sans text-[16px] font-extrabold text-white leading-tight">Merchant's Den</h2>
              <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#475569' }}>
                After Floor {run.currentFloor} · Rest Stop
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Coins size={13} style={{ color: '#f59e0b' }} />
            <span className="font-mono text-sm font-bold" style={{ color: '#f59e0b' }}>{run.gold}</span>
          </div>
        </div>

        {/* HP bar — updates live when potions are bought */}
        <div className="mb-1.5 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <Heart size={12} className="text-red-500" />
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#475569' }}>YOUR HP</span>
          </div>
          <span className="font-mono text-[11px] font-bold" style={{ color: '#22d3ee' }}>{run.hp} / {run.maxHp}</span>
        </div>
        <HpBar current={run.hp} max={run.maxHp} color="#22d3ee" />
      </div>

      {/* ── Merchant quote ── */}
      <div className="shrink-0 px-5 pt-4 pb-2">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p className="text-[12px] leading-relaxed" style={{ color: '#94A3B8' }}>
            <span className="font-bold" style={{ color: '#f59e0b' }}>Merchant: </span>
            "Floor {nextFloor} awaits. Potions restore HP immediately. Or retire now and claim your glory."
          </p>
        </div>
      </div>

      {/* ── Items list ── */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.div
              key={item.itemName}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="relative"
            >
              {purchased.has(item.itemName) && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(9,15,22,0.75)' }}>
                  <div className="flex items-center gap-2 rounded-2xl px-4 py-2"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <Package size={12} style={{ color: '#10b981' }} />
                    <span className="font-mono text-[10px] font-bold" style={{ color: '#10b981' }}>Purchased</span>
                  </div>
                </div>
              )}
              <div className={purchased.has(item.itemName) ? 'opacity-30' : ''}>
                <ItemCard
                  item={item}
                  showBuy={!purchased.has(item.itemName)}
                  canAfford={(run.gold ?? 0) >= (item.cost ?? 10)}
                  onBuy={() => handleBuy(item)}
                  index={i}
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div className="h-2" />
      </div>

      {/* ── CTAs ── */}
      <div className="shrink-0 px-5 pb-safe pt-3 border-t space-y-2.5" style={{ borderColor: BORDER, background: `linear-gradient(to top, ${DEEP} 55%, transparent)` }}>
        {purchased.size > 0 && (
          <p className="text-center font-mono text-[10px]" style={{ color: '#10b981' }}>
            {purchased.size} item{purchased.size > 1 ? 's' : ''} purchased · effects applied ✓
          </p>
        )}

        {/* Primary: descend */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          disabled={isThinking}
          className="w-full group flex items-center justify-center gap-2.5 rounded-2xl px-8 py-5 font-sans font-extrabold text-sm text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#065f46,#10b981)', boxShadow: '0 0 28px rgba(16,185,129,0.2)' }}
        >
          <span>Descend to Floor {nextFloor}</span>
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
        </motion.button>

        {/* Secondary: retire */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleRetire}
          disabled={isThinking}
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-8 py-5 font-sans font-bold text-sm text-[#475569] border border-[#1E293B] bg-transparent disabled:opacity-40 hover:border-[#334155] hover:text-[#64748B] transition-colors"
        >
          <LogOut size={13} />
          <span>Retire after Floor {run.currentFloor}</span>
        </motion.button>
      </div>
    </div>
  );
}
