import React from 'react';
import { motion } from 'motion/react';
import { ActionStyle } from '../types';
import { audioHaptics } from '../audio';

const STYLE_THEMES: Record<ActionStyle, {
  border: string;
  glow:   string;
  badge:  string;
  text:   string;
  hover:  string;
  label:  string;
}> = {
  aggressive: {
    border: 'border-rose-500/40',
    glow:   'rgba(244, 63, 94, 0.15)',
    badge:  'bg-rose-500/10 text-rose-400 border-rose-500/30',
    text:   'text-rose-400',
    hover:  'hover:border-rose-500/70',
    label:  '⚔',
  },
  diplomatic: {
    border: 'border-cyan-400/40',
    glow:   'rgba(34, 211, 238, 0.15)',
    badge:  'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
    text:   'text-cyan-400',
    hover:  'hover:border-cyan-400/70',
    label:  '🕊',
  },
  cautious: {
    border: 'border-amber-400/40',
    glow:   'rgba(251, 191, 36, 0.15)',
    badge:  'bg-amber-400/10 text-amber-400 border-amber-400/30',
    text:   'text-amber-400',
    hover:  'hover:border-amber-400/70',
    label:  '🛡',
  },
  unpredictable: {
    border: 'border-violet-400/40',
    glow:   'rgba(167, 139, 250, 0.15)',
    badge:  'bg-violet-400/10 text-violet-400 border-violet-400/30',
    text:   'text-violet-400',
    hover:  'hover:border-violet-400/70',
    label:  '🎲',
  },
};

interface Props {
  label:    string;
  style?:   ActionStyle;
  onPress:  () => void;
  disabled?: boolean;
  index?:   number;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
}

export function ActionButton({ label, style = 'cautious', onPress, disabled = false, index = 0, variant }: Props) {
  const theme = STYLE_THEMES[style];

  const handleClick = () => {
    if (disabled) return;
    audioHaptics.click();
    onPress();
  };

  // Override styles for special variants
  if (variant === 'primary') {
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleClick}
        disabled={disabled}
        className="w-full rounded-xl border border-emerald-500/50 px-4 py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg, #059669, #10b981)',
          boxShadow: disabled ? 'none' : '0 0 20px rgba(16, 185, 129, 0.3)',
        }}
      >
        {label}
      </motion.button>
    );
  }

  if (variant === 'danger') {
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleClick}
        disabled={disabled}
        className="w-full rounded-xl border border-rose-500/50 px-4 py-3.5 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg, #be123c, #f43f5e)',
          boxShadow: disabled ? 'none' : '0 0 20px rgba(244, 63, 94, 0.3)',
        }}
      >
        {label}
      </motion.button>
    );
  }

  if (variant === 'gold') {
    return (
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, type: 'spring', stiffness: 300, damping: 25 }}
        whileTap={{ scale: 0.96 }}
        whileHover={{ scale: 1.02 }}
        onClick={handleClick}
        disabled={disabled}
        className="w-full rounded-xl border border-amber-400/50 px-4 py-3.5 text-sm font-bold text-amber-900 transition-all disabled:cursor-not-allowed disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg, #d97706, #fbbf24)',
          boxShadow: disabled ? 'none' : '0 0 20px rgba(251, 191, 36, 0.3)',
        }}
      >
        {label}
      </motion.button>
    );
  }

  // Default: styled action button
  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, type: 'spring', stiffness: 280, damping: 22 }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.01, boxShadow: `0 0 16px ${theme.glow}` }}
      onClick={handleClick}
      disabled={disabled}
      className={`group relative w-full overflow-hidden rounded-xl border px-4 py-3.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${theme.border} ${theme.hover}`}
      style={{
        background: `rgba(15, 23, 42, 0.8)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.03)`,
      }}
    >
      {/* Hover shimmer */}
      <motion.div
        className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${theme.glow}, transparent)` }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <span className="font-mono text-sm font-medium text-slate-200">{label}</span>
        <span
          className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${theme.badge}`}
        >
          {theme.label}
        </span>
      </div>
    </motion.button>
  );
}
