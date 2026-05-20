import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Loader2 } from 'lucide-react';
import { useGameStore } from '../store';

interface Props {
  message?: string;
}

/**
 * ThinkingPanel — full-screen pulsing overlay shown during any agent call.
 * Uses multiple animated dots + typewriter reveal of the thinking message.
 */
export function ThinkingPanel({ message }: Props) {
  const thinkingMessage = useGameStore((s) => s.thinkingMessage);
  const msg = message ?? thinkingMessage;

  const dots = [0, 1, 2];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="mx-4 rounded-2xl border border-cyan-400/30 bg-slate-900/80 p-6 backdrop-blur-sm"
          style={{ maxWidth: '340px', width: '100%', boxShadow: '0 0 40px rgba(34,211,238,0.15)' }}
        >
          {/* Header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative">
              <Cpu size={18} className="text-cyan-400" />
              <motion.div
                className="absolute -inset-1 rounded-full"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ background: 'rgba(34,211,238,0.2)' }}
              />
            </div>
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">
              AI Agent Processing
            </span>
          </div>

          {/* Thinking dots */}
          <div className="mb-4 flex items-center gap-2">
            {dots.map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-cyan-400"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
            <Loader2 size={14} className="ml-1 animate-spin text-slate-500" />
          </div>

          {/* Message */}
          <p className="font-mono text-sm leading-relaxed text-slate-300">
            {msg}
          </p>

          {/* Progress bar */}
          <div className="mt-4 h-[2px] w-full overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400/30 via-cyan-400 to-cyan-400/30"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              style={{ width: '60%' }}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
