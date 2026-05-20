import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Set to false for screens with fixed header/footer (EncounterScreen) */
  scrollable?: boolean;
}

/**
 * MobileContainer — global layout wrapper.
 * Enforces: bg-slate-950, full h/w, overflow control.
 * Each screen manages its own padding and centering internally.
 */
export function MobileContainer({ children, className = '', style, scrollable = true }: MobileContainerProps) {
  return (
    <div
      className={`
        relative flex h-full w-full flex-col
        bg-slate-950 text-slate-100
        ${scrollable ? 'overflow-y-auto' : 'overflow-hidden'}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * CenteredScroll — the vertical-centering scroll wrapper.
 *
 * Pattern:  outer = overflow-y-auto flex-1
 *           inner = min-h-full flex flex-col justify-center  ← KEY
 *
 * When content is SHORT  → inner fills height → justify-center centers it.
 * When content is TALL   → inner exceeds height → scrolls from top naturally.
 * px-6 / pt-14 / pb-6 enforced here so no screen can forget them.
 */
export function CenteredScroll({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className={`flex min-h-full flex-col justify-center gap-5 px-6 pt-14 pb-6 ${className}`}>
        {children}
      </div>
    </div>
  );
}

/** Legacy alias kept so RecapScreen import doesn't break */
export const ScrollContent = CenteredScroll;
