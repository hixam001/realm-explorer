import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Coins, Package, ChevronRight } from 'lucide-react';
import { useGameStore } from '../store';
import { MERCHANT_ITEMS, MOCK_ENCOUNTERS } from '../data';
import { GameItem } from '../types';
import { ThinkingPanel } from '../components/ThinkingPanel';
import { ItemCard } from '../components/ItemCard';
import { audioHaptics } from '../audio';

const BG = '#090F16'; const CARD = '#0F172A'; const DEEP = '#050B14'; const BORDER = '#1E293B';

function HpBar({ current, max, color }: { current: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, current / max));
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full" style={{ background: DEEP, border: `1px solid ${BORDER}` }}>
      <motion.div className="h-full rounded-full" animate={{ width: `${pct * 100}%` }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 6px ${color}50` }} />
    </div>
  );
}

export function MerchantScreen() {
  const { run, isThinking, setThinking, setRun, setCurrentEncounter, setCombatLog, setActiveScreen, addToInventory, addEventLog } = useGameStore(s => s);
  const [items, setItems] = useState<GameItem[]>([]);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      setThinking(true, 'The merchant arranges their wares...');
      await new Promise(r => setTimeout(r, 900));
      setItems(MERCHANT_ITEMS);
      setThinking(false);
    })();
  }, []);

  const handleBuy = (item: GameItem) => {
    if (!run) return;
    const cost = item.cost ?? 10;
    if (run.gold < cost) return;
    audioHaptics.gold();
    setRun({ ...run, gold: run.gold - cost });
    addToInventory(item);
    addEventLog(`Purchased ${item.itemName}`);
    setPurchased(prev => new Set([...prev, item.itemName]));
  };

  const handleContinue = async () => {
    if (!run) return;
    audioHaptics.click();
    setThinking(true, 'The DM is building Floor 5 — the Final Boss...');
    await new Promise(r => setTimeout(r, 1100));
    const boss = MOCK_ENCOUNTERS[MOCK_ENCOUNTERS.length - 1];
    setCurrentEncounter(boss);
    setCombatLog([{ type: 'narrative', text: boss.narrativeText }]);
    setRun({ ...run, currentFloor: 5 });
    setThinking(false);
    setActiveScreen('encounter');
  };

  if (!run) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: BG }}>
      {isThinking && <ThinkingPanel />}

      {/* Header */}
      <div className="shrink-0 px-5 pt-14 pb-4" style={{ background: 'rgba(5,11,20,0.97)', backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg,#78350f,#d97706)', boxShadow: '0 0 16px rgba(217,119,6,0.3)' }}>
              <ShoppingBag size={16} className="text-amber-200" />
            </div>
            <div>
              <h2 className="font-sans text-[15px] font-extrabold text-white">Merchant's Den</h2>
              <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#475569' }}>Floor 4 · Mid-Run Shop</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl px-3 py-2" style={{ background: CARD, border: `1px solid ${BORDER}` }}>
            <Coins size={13} style={{ color: '#f59e0b' }} />
            <span className="font-mono text-sm font-bold" style={{ color: '#f59e0b' }}>{run.gold}</span>
          </div>
        </div>
        {/* HP bar */}
        <div className="mt-3">
          <div className="mb-1.5 flex justify-between">
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: '#475569' }}>HP Remaining</span>
            <span className="font-mono text-[10px] font-bold" style={{ color: '#22d3ee' }}>{run.hp} / {run.maxHp}</span>
          </div>
          <HpBar current={run.hp} max={run.maxHp} color="#22d3ee" />
        </div>
      </div>

      {/* Merchant quote */}
      <div className="shrink-0 px-5 pt-4 pb-2">
        <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p className="text-[12px] leading-relaxed" style={{ color: '#94A3B8' }}>
            <span className="font-bold" style={{ color: '#f59e0b' }}>Merchant: </span>
            "Ah, a survivor. Browse freely — Floor 5 waits, and it remembers no mercy."
          </p>
        </div>
      </div>

      {/* Items — vertically centered in scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col justify-center gap-3.5 px-5 py-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div key={item.itemName} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} className="relative">
                {purchased.has(item.itemName) && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl"
                    style={{ background: 'rgba(9,15,22,0.8)' }}>
                    <div className="flex items-center gap-2 rounded-2xl px-4 py-2"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                      <Package size={12} style={{ color: '#10b981' }} />
                      <span className="font-mono text-[10px] font-bold" style={{ color: '#10b981' }}>Purchased</span>
                    </div>
                  </div>
                )}
                <div className={purchased.has(item.itemName) ? 'opacity-30' : ''}>
                  <ItemCard item={item} showBuy={!purchased.has(item.itemName)}
                    canAfford={(run.gold ?? 0) >= (item.cost ?? 10)} onBuy={() => handleBuy(item)} index={i} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="h-14" />
        </div>
      </div>

      {/* CTA */}
      <div className="shrink-0 px-5 pb-6 pt-3"
        style={{ background: `linear-gradient(to top, ${DEEP} 55%, rgba(5,11,20,0.5) 85%, transparent)` }}>
        {purchased.size > 0 && (
          <p className="mb-2.5 text-center font-mono text-[10px]" style={{ color: '#10b981' }}>
            {purchased.size} item{purchased.size > 1 ? 's' : ''} ready
          </p>
        )}
        <div className="flex justify-center">
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleContinue} disabled={isThinking}
            className="group flex items-center gap-2.5 rounded-full px-8 py-3.5 font-sans font-extrabold text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#065f46,#10b981)', boxShadow: '0 0 28px rgba(16,185,129,0.2)', fontSize: 12 }}>
            <span>Descend to Floor 5</span>
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
