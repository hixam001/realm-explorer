import React from 'react';
import { motion } from 'motion/react';
import { Sword, Shield, Circle, Zap } from 'lucide-react';
import { GameItem, ItemType } from '../types';
import { audioHaptics } from '../audio';

const TYPE_CONFIG: Record<ItemType, {
  color: string; bg: string; border: string; stripColor: string;
  icon: React.ReactNode; label: string;
}> = {
  weapon:     { color: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   border: 'rgba(244,63,94,0.2)',   stripColor: '#f43f5e', icon: <Sword  size={12}/>, label: 'WEAPON' },
  armor:      { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)', stripColor: '#a78bfa', icon: <Shield size={12}/>, label: 'ARMOR' },
  ring:       { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  stripColor: '#fbbf24', icon: <Circle size={12}/>, label: 'RING' },
  consumable: { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  stripColor: '#34d399', icon: <Zap    size={12}/>, label: 'USE' },
  relic:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  stripColor: '#f59e0b', icon: <Zap    size={12}/>, label: 'RELIC' },
  potion:     { color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.2)',  stripColor: '#34d399', icon: <Circle size={12}/>, label: 'POTION' },
};

interface Props {
  item:       GameItem;
  onBuy?:     () => void;
  canAfford?: boolean;
  showBuy?:   boolean;
  index?:     number;
}

export function ItemCard({ item, onBuy, canAfford = true, showBuy = false, index = 0 }: Props) {
  const cfg = TYPE_CONFIG[item.itemType] ?? TYPE_CONFIG.consumable;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.09, type: 'spring', stiffness: 260, damping: 22 }}
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
    >
      {/* Colored top accent strip */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${cfg.stripColor}, transparent)` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-sm font-bold leading-tight text-white">{item.itemName}</h3>
          <div
            className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider"
            style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
          >
            {cfg.icon}
            {cfg.label}
          </div>
        </div>

        {/* Effect */}
        <p className="mb-2 font-mono text-xs font-semibold" style={{ color: cfg.color }}>
          {item.itemEffect}
        </p>

        {/* Style note */}
        <p className="mb-2.5 text-xs leading-relaxed text-slate-400">{item.styleNote}</p>

        {/* Flavor */}
        <p className="font-mono text-[10px] italic text-slate-600">"{item.flavorText}"</p>
      </div>

      {/* Buy row */}
      {showBuy && (
        <div
          className="flex items-center justify-between gap-4 border-t border-slate-800/60 px-5 py-5"
          style={{ background: 'rgba(15,23,42,0.4)' }}
        >
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-bold text-amber-400">◈ {item.cost ?? 10}</span>
            <span className="font-mono text-xs text-slate-600">gold</span>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => { if (canAfford) { audioHaptics.gold(); onBuy?.(); } }}
            disabled={!canAfford}
            className="rounded-xl px-8 py-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-30"
            style={{
              background:  canAfford ? 'linear-gradient(135deg, #d97706, #fbbf24)' : 'rgba(30,41,59,0.6)',
              color:       canAfford ? '#1c1917' : '#64748b',
              boxShadow:   canAfford ? '0 0 14px rgba(251,191,36,0.3)' : 'none',
            }}
          >
            {canAfford ? 'BUY' : 'Not enough gold'}
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
