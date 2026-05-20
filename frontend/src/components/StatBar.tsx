import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface Props {
  current:   number;
  max:       number;
  label?:    string;
  color?:    string;
  showGhost?: boolean; // enable hemorrhage effect
  displayCurrent?: number; // ghost bar value (lags behind current)
}

/**
 * StatBar — HP bar with optional hemorrhage ghost bar.
 *
 * When showGhost=true, the main bar drops instantly to `current` but
 * a secondary red ghost bar waits and then shrinks to match, simulating blood loss.
 */
export function StatBar({
  current,
  max,
  label,
  color = '#22d3ee',
  showGhost = false,
  displayCurrent,
}: Props) {
  const pct         = Math.max(0, Math.min(1, current / max));
  const ghostPct    = Math.max(0, Math.min(1, (displayCurrent ?? current) / max));
  const prevPctRef  = useRef(pct);

  useEffect(() => {
    prevPctRef.current = pct;
  }, [pct]);

  // Color transitions based on HP percentage
  const barColor = pct > 0.6 ? color
    : pct > 0.3 ? '#fbbf24'
    : '#f43f5e';

  return (
    <div className="w-full">
      {/* Label row */}
      <div className="mb-1.5 flex items-center justify-between">
        {label && (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {label}
          </span>
        )}
        <span
          className="font-mono text-xs font-bold tabular-nums"
          style={{ color: barColor }}
        >
          {current}<span className="text-slate-600">/{max}</span>
        </span>
      </div>

      {/* Track */}
      <div
        className="relative h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: 'rgba(30,41,59,0.8)' }}
      >
        {/* Ghost bar (hemorrhage effect — lags behind) */}
        {showGhost && ghostPct > pct && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${ghostPct * 100}%`,
              background: 'rgba(244, 63, 94, 0.5)',
            }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
          />
        )}

        {/* Main HP bar */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: barColor }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />

        {/* Shine overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}
