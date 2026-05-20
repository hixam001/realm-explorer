import { create } from 'zustand';
import {
  RunState,
  DungeonEncounter,
  GameItem,
  PlayerProfile,
  PlayStyle,
  ActionStyle,
  AnimationEvent,
  Screen,
  CombatLogEntry,
} from './types';

// ─── Play Style Derivation ────────────────────────────────────────────────────
export function derivePlayStyle(history: ActionStyle[]): PlayStyle {
  if (history.length === 0) return 'cautious';
  const last8        = history.slice(-8);
  const aggressive   = last8.filter(a => a === 'aggressive').length;
  const diplomatic   = last8.filter(a => a === 'diplomatic').length;
  const cautious     = last8.filter(a => a === 'cautious').length;
  const unpredictable = last8.filter(a => a === 'unpredictable').length;
  const max = Math.max(aggressive, diplomatic, cautious, unpredictable);
  if (aggressive    === max) return 'aggressive';
  if (diplomatic    === max) return 'diplomatic';
  if (cautious      === max) return 'cautious';
  return 'unpredictable';
}

// ─── Store Shape ──────────────────────────────────────────────────────────────
interface GameStore {
  // Navigation
  activeScreen:    Screen;

  // Run state
  run:             RunState | null;
  currentEncounter: DungeonEncounter | null;
  enemyHp:         number;
  combatTurns:     number;
  combatLog:       CombatLogEntry[];
  combatOver:      boolean;
  playerWon:       boolean;
  lastWinQuality:  string;

  // HP animation — displayHp lags behind currentHp for hemorrhage effect
  displayHp:       number;

  // Agent call state
  isThinking:      boolean;
  thinkingMessage: string;

  // Animation queue
  animQueue:       AnimationEvent[];

  // Player profile
  profile:         PlayerProfile | null;

  // Recap
  recapText:       string;
  recapTitle:      string;

  // Actions
  setActiveScreen:     (s: Screen) => void;
  setRun:              (run: RunState) => void;
  updateRun:           (updates: Partial<RunState>) => void;
  setCurrentEncounter: (enc: DungeonEncounter) => void;
  clearEncounter:      () => void;
  addToInventory:      (item: GameItem) => void;
  applyHpDelta:        (delta: number) => void;
  syncDisplayHp:       () => void;
  setEnemyHp:          (hp: number) => void;
  applyEnemyHpDelta:   (delta: number) => void;
  setThinking:         (on: boolean, msg?: string) => void;
  setProfile:          (p: PlayerProfile) => void;
  resetRun:            () => void;
  advanceFloor:        () => void;
  addEventLog:         (entry: string) => void;
  appendAction:        (action: ActionStyle) => void;
  addGold:             (amount: number) => void;
  spendGold:           (amount: number) => boolean;
  pushAnimation:       (event: AnimationEvent) => void;
  shiftAnimation:      () => void;
  setCombatLog:        (log: CombatLogEntry[]) => void;
  appendCombatLog:     (entry: CombatLogEntry) => void;
  setCombatOver:       (won: boolean) => void;
  resetCombat:         () => void;
  setRecap:            (text: string, title: string) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  activeScreen:     'home',
  run:              null,
  currentEncounter: null,
  enemyHp:          10,
  combatTurns:      0,
  combatLog:        [],
  combatOver:       false,
  playerWon:        false,
  lastWinQuality:   'clean',
  displayHp:        10,
  isThinking:       false,
  thinkingMessage:  'The Dungeon Master is thinking...',
  animQueue:        [],
  profile:          null,
  recapText:        '',
  recapTitle:       '',

  setActiveScreen: (s) => set({ activeScreen: s }),

  setRun: (run) => set({ run, displayHp: run.hp }),

  updateRun: (updates) =>
    set((s) => ({ run: s.run ? { ...s.run, ...updates } : null })),

  setCurrentEncounter: (enc) =>
    set({ currentEncounter: enc, enemyHp: 10, combatTurns: 0, combatOver: false, playerWon: false }),

  clearEncounter: () => set({ currentEncounter: null }),

  addToInventory: (item) =>
    set((s) => ({
      run: s.run ? { ...s.run, inventory: [...s.run.inventory, item] } : null,
    })),

  applyHpDelta: (delta) =>
    set((s) => {
      if (!s.run) return {};
      const newHp = Math.max(0, s.run.hp + delta);
      return { run: { ...s.run, hp: newHp } };
    }),

  // Called 500ms after applyHpDelta to trigger hemorrhage animation catch-up
  syncDisplayHp: () =>
    set((s) => ({ displayHp: s.run?.hp ?? s.displayHp })),

  setEnemyHp: (hp) => set({ enemyHp: Math.max(0, hp) }),

  applyEnemyHpDelta: (delta) =>
    set((s) => ({ enemyHp: Math.max(0, s.enemyHp + delta) })),

  setThinking: (on, msg) =>
    set({
      isThinking:      on,
      thinkingMessage: msg ?? 'The Dungeon Master is thinking...',
    }),

  setProfile: (p) => set({ profile: p }),

  resetRun: () =>
    set({
      run:              null,
      currentEncounter: null,
      enemyHp:          10,
      combatTurns:      0,
      combatLog:        [],
      combatOver:       false,
      playerWon:        false,
      displayHp:        10,
      recapText:        '',
      recapTitle:       '',
    }),

  advanceFloor: () =>
    set((s) => ({
      run: s.run ? { ...s.run, currentFloor: s.run.currentFloor + 1 } : null,
      currentEncounter: null,
      enemyHp:          10,
      combatTurns:      0,
      combatLog:        [],
      combatOver:       false,
      playerWon:        false,
    })),

  addEventLog: (entry) =>
    set((s) => ({
      run: s.run ? { ...s.run, eventLog: [...s.run.eventLog, entry] } : null,
    })),

  appendAction: (action) =>
    set((s) => {
      if (!s.run) return {};
      const newHistory = [...s.run.actionHistory, action];
      const newStyle   = derivePlayStyle(newHistory);
      return { run: { ...s.run, actionHistory: newHistory, playStyle: newStyle } };
    }),

  addGold: (amount) =>
    set((s) => ({
      run: s.run ? { ...s.run, gold: s.run.gold + amount } : null,
    })),

  spendGold: (amount) => {
    const state = get();
    if (!state.run || state.run.gold < amount) return false;
    set((s) => ({
      run: s.run ? { ...s.run, gold: s.run.gold - amount } : null,
    }));
    return true;
  },

  pushAnimation: (event) =>
    set((s) => ({ animQueue: [...s.animQueue, event] })),

  shiftAnimation: () =>
    set((s) => ({ animQueue: s.animQueue.slice(1) })),

  setCombatLog: (log) => set({ combatLog: log }),

  appendCombatLog: (entry) =>
    set((s) => ({ combatLog: [...s.combatLog, entry] })),

  setCombatOver: (won) =>
    set({ combatOver: true, playerWon: won }),

  resetCombat: () =>
    set({
      combatLog:   [],
      combatOver:  false,
      playerWon:   false,
      combatTurns: 0,
      enemyHp:     10,
    }),

  setRecap: (text, title) => set({ recapText: text, recapTitle: title }),
}));
