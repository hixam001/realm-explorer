import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useGameStore } from './store';
import { HomeScreen }        from './screens/HomeScreen';
import { ClassSelectScreen } from './screens/ClassSelectScreen';
import { EncounterScreen }   from './screens/EncounterScreen';
import { MerchantScreen }    from './screens/MerchantScreen';
import { RecapScreen }       from './screens/RecapScreen';

const SCREENS: Record<string, React.ComponentType> = {
  home: HomeScreen, classSelect: ClassSelectScreen,
  encounter: EncounterScreen, merchant: MerchantScreen, recap: RecapScreen,
};

export default function App() {
  const activeScreen = useGameStore(s => s.activeScreen);
  const Screen = (SCREENS[activeScreen] ?? HomeScreen) as React.ComponentType;

  return (
    /*
     * Outer: bg-black on desktop, transparent (hidden behind chassis) on mobile.
     * On mobile the chassis IS the viewport.
     */
    <div className="min-h-[100dvh] w-full bg-black flex items-center justify-center p-0 sm:p-4">

      {/*
       * ── Phone chassis ────────────────────────────────────────────────────
       * Mobile  : w-full h-[100dvh], rounded-none, border-0  → edge-to-edge
       * Desktop : max-w-[410px] h-[820px], rounded-[48px], border-[12px]
       *
       * flex flex-col so screens (flex-1 children) fill the space cleanly.
       */}
      <div className="
        w-full h-[100dvh]
        sm:max-w-[410px] sm:h-[820px] sm:max-h-[min(calc(100dvh-2rem),820px)]
        bg-[#050B14]
        rounded-none sm:rounded-[48px]
        border-0 sm:border-[12px] sm:border-[#10192A]
        relative shadow-2xl flex flex-col font-sans overflow-hidden
      ">

        {/*
         * Software notch — hidden on mobile, visible on desktop.
         * Positioned at top-center inside the chassis, matching border colour.
         */}
        <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7
                        bg-[#10192A] rounded-b-3xl z-50 items-center justify-center">
          <div className="w-14 h-1.5 bg-black/50 rounded-full" />
          <div className="w-2.5 h-2.5 bg-indigo-950 rounded-full ml-3" />
        </div>

        {/* Screen with slide transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScreen}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="flex flex-1 flex-col min-h-0"
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
