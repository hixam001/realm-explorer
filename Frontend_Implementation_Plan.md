# Frontend Implementation Plan
# Realm Explorer — Agentic Dungeon Crawler
### React Native (Expo) · TypeScript · Zustand · Firebase Client SDK

> **Target file path in repo:** `frontend/docs/Frontend_Implementation_Plan.md`

---

## 1. Architecture Overview

```
React Native App (TypeScript)
        │
        ├── src/screens/         ← UI layer (one file per screen)
        ├── src/store/           ← Global state (Zustand)
        ├── src/services/        ← All external calls (api.ts, firebase.ts)
        ├── src/components/      ← Shared UI components
        └── src/models/          ← TypeScript types + constants
                │
                │  HTTP POST (JSON)
                ▼
        Express Backend (Firebase Cloud Function)
        POST /api/v1/dm    → { success, data: { encounter } }
        POST /api/v1/rival → { success, data: { combat } }
        POST /api/v1/loot  → { success, data: { item } } or { data: { items[] } }
        POST /api/v1/recap → { success, data: { recap } }
```

**Critical:** Every backend response wraps its payload inside `data`. The api.ts layer
must always destructure `response.data.encounter`, `response.data.combat`, etc.
Never assume the payload is at the top level.

---

## 2. Directory Structure

```
src/
├── screens/
│   ├── HomeScreen.tsx          ← Profile, run history, Start Run button
│   ├── ClassSelectScreen.tsx   ← 3 class cards, animated selection
│   ├── EncounterScreen.tsx     ← Core game screen (dmAgent + rivalAgent)
│   ├── MerchantScreen.tsx      ← Floor 4 shop (lootAgent merchantMode)
│   └── RecapScreen.tsx         ← End-of-run story (recapAgent)
│
├── store/
│   └── gameStore.ts            ← Zustand — single source of truth
│
├── services/
│   ├── api.ts                  ← All HTTP calls to Express backend
│   └── firebase.ts             ← Firebase client init + Firestore helpers
│
├── models/
│   ├── types.ts                ← All TypeScript interfaces
│   └── constants.ts            ← Class definitions, floor config, colours
│
└── components/
    ├── DmThinkingPanel.tsx     ← Pulsing overlay shown during agent calls
    ├── StatBar.tsx             ← HP bar + floor + gold
    ├── ActionButton.tsx        ← Styled encounter action button
    └── ItemCard.tsx            ← Loot item display card
```

---

## 3. TypeScript Types — `src/models/types.ts`

These types mirror the exact schemas from the backend. Every field name and type
must match what the Express controllers return.

```typescript
// ─── Enums ───────────────────────────────────────────────────────────────────

export type PlayerClass   = 'blade_dancer' | 'ember_mage' | 'shadow_rogue';
export type PlayStyle     = 'aggressive' | 'diplomatic' | 'cautious' | 'unpredictable';
export type EnemyType     = 'combat' | 'negotiation' | 'hybrid';
export type RunStatus     = 'active' | 'completed' | 'died';
export type ItemType      = 'weapon' | 'armor' | 'ring' | 'consumable';
export type WinQuality    = 'clean' | 'close' | 'messy';
export type Outcome       = 'success' | 'partial' | 'failure';

// ─── Backend Response Wrapper ─────────────────────────────────────────────────

// All backend responses follow: { success: boolean, data: T }
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ─── DM Agent — POST /api/v1/dm ───────────────────────────────────────────────

export interface Encounter {
  encounterTitle:   string;
  narrativeText:    string;
  enemyName:        string;
  enemyType:        EnemyType;
  availableActions: string[];
  difficultyWeight: number;       // 1–5
  dmReasoning:      string;       // visible in DM Reasoning panel
  // Fields added after player acts (may be null on first load):
  playerChoice?:    string | null;
  outcome?:         Outcome | null;
  hpAfter?:         number | null;
}

export interface DmResponse {
  encounter: Encounter;
}

// ─── Rival Agent — POST /api/v1/rival ────────────────────────────────────────

export interface CombatResult {
  outcomeText:    string;
  playerHpDelta:  number;   // negative = damage to player
  enemyHpDelta:   number;   // negative = damage to enemy
  combatOver:     boolean;
  playerWon:      boolean;
  winQuality:     WinQuality;
  rivalReasoning: string;
}

export interface RivalResponse {
  combat: CombatResult;
}

// ─── Loot Agent — POST /api/v1/loot ──────────────────────────────────────────

export interface GameItem {
  itemName:   string;
  itemEffect: string;
  styleNote:  string;
  flavorText: string;
  itemType:   ItemType;
}

export interface LootResponse {
  item: GameItem;     // normal mode
}

export interface MerchantResponse {
  items: GameItem[];  // merchantMode: true — always 3 items
}

// ─── Recap Agent — POST /api/v1/recap ────────────────────────────────────────

export interface RecapResult {
  narrativeText: string;
  runTitle:      string;
}

export interface RecapResponse {
  recap: RecapResult;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export interface RunState {
  runId:         string;
  playerId:      string;
  playerClass:   PlayerClass;
  hp:            number;
  maxHp:         number;
  gold:          number;
  currentFloor:  number;    // 1–5
  playStyle:     PlayStyle;
  actionHistory: string[];
  eventLog:      string[];
  inventory:     GameItem[];
  status:        RunStatus;
}

export interface PlayerProfile {
  playerId:        string;
  runsCompleted:   number;
  averageStyle:    PlayStyle;
  favoriteClass:   PlayerClass;
  bestDepth:       number;
  allTimeTitles:   string[];
  unlockedClasses: PlayerClass[];
}

// ─── Class Definition (for ClassSelectScreen) ────────────────────────────────

export interface ClassDefinition {
  id:            PlayerClass;
  name:          string;
  description:   string;
  playStyle:     PlayStyle;
  startingHp:    number;
  ability:       string;
  abilityDesc:   string;
  colourAccent:  string;
}
```

---

## 4. Constants — `src/models/constants.ts`

```typescript
import { ClassDefinition } from './types';

export const BASE_URL =
  'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/api/v1';

export const COLOURS = {
  bg:          '#1A1A2E',
  surface:     '#2A2A4E',
  accent:      '#1D9E75',
  danger:      '#D85A30',
  amber:       '#BA7517',
  textPrimary: '#FFFFFF',
  textSecond:  '#B0B0C0',
  textMuted:   '#555566',
  border:      '#3A3A6E',
} as const;

export const FLOOR_CONFIG = {
  1: { type: 'combat',   label: 'Floor 1' },
  2: { type: 'combat',   label: 'Floor 2' },
  3: { type: 'event',    label: 'Floor 3 — Rift' },
  4: { type: 'merchant', label: 'Floor 4 — Merchant' },
  5: { type: 'boss',     label: 'Floor 5 — Boss' },
} as const;

export const CLASSES: ClassDefinition[] = [
  {
    id:           'blade_dancer',
    name:         'Blade Dancer',
    description:  'A swift melee fighter who excels in rapid combos.',
    playStyle:    'aggressive',
    startingHp:   10,
    ability:      'Flurry',
    abilityDesc:  'Deal double damage, but take chip damage.',
    colourAccent: '#D85A30',
  },
  {
    id:           'ember_mage',
    name:         'Ember Mage',
    description:  'A tactical spellcaster who prefers high-risk plays.',
    playStyle:    'unpredictable',
    startingHp:   8,
    ability:      'Arcane Burst',
    abilityDesc:  'Area damage — needs cooldown turn before reuse.',
    colourAccent: '#BA7517',
  },
  {
    id:           'shadow_rogue',
    name:         'Shadow Rogue',
    description:  'A careful infiltrator who uses deception and escape.',
    playStyle:    'cautious',
    startingHp:   9,
    ability:      'Vanish',
    abilityDesc:  'Skip one encounter per floor with no HP cost.',
    colourAccent: '#534AB7',
  },
];
```

---

## 5. API Service Layer — `src/services/api.ts`

**This is the most important file to get exactly right.** Every function must
destructure from `response.data`, not from the top-level response object.

```typescript
import { BASE_URL } from '../models/constants';
import {
  ApiResponse,
  DmResponse,
  RivalResponse,
  LootResponse,
  MerchantResponse,
  RecapResponse,
  RunState,
} from '../models/types';

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function post<T>(endpoint: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`${endpoint} returned HTTP ${res.status}`);
  }

  const json: ApiResponse<T> = await res.json();

  // The backend ALWAYS wraps in { success, data }.
  // Even fallback responses from errorHandler.js follow this shape.
  return json.data;
}

// ─── Health check (use on HomeScreen mount to wake up cold function) ──────────

export async function pingHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── DM Agent — POST /api/v1/dm ───────────────────────────────────────────────
// Returns: { encounter: Encounter }

export async function callDmAgent(params: {
  runId:         string;
  playerId:      string;
  floorNumber:   number;
  playerClass:   string;
  hp:            number;
  maxHp:         number;
  playStyle:     string;
  actionHistory: string[];
  eventLog:      string[];
}): Promise<DmResponse> {
  return post<DmResponse>('/dm', params);
}

// ─── Rival Agent — POST /api/v1/rival ────────────────────────────────────────
// Returns: { combat: CombatResult }

export async function callRivalAgent(params: {
  runId:        string;
  enemyName:    string;
  enemyType:    string;
  enemyHp:      number;
  playerAction: string;
  playerHp:     number;
  playerClass:  string;
  combatTurns:  number;
}): Promise<RivalResponse> {
  return post<RivalResponse>('/rival', params);
}

// ─── Loot Agent — POST /api/v1/loot (normal floor win) ───────────────────────
// Returns: { item: GameItem }

export async function callLootAgent(params: {
  runId:       string;
  playerId:    string;
  playerClass: string;
  playStyle:   string;
  floorNumber: number;
  winQuality:  string;
  eventLog:    string[];
}): Promise<LootResponse> {
  return post<LootResponse>('/loot', { ...params, merchantMode: false });
}

// ─── Loot Agent — POST /api/v1/loot (Floor 4 merchant mode) ──────────────────
// Returns: { items: GameItem[] }  ← DIFFERENT SHAPE from normal loot

export async function callMerchantAgent(params: {
  runId:       string;
  playerId:    string;
  playerClass: string;
  playStyle:   string;
  floorNumber: number;
  winQuality:  string;
  eventLog:    string[];
}): Promise<MerchantResponse> {
  return post<MerchantResponse>('/loot', { ...params, merchantMode: true });
}

// ─── Recap Agent — POST /api/v1/recap ────────────────────────────────────────
// Returns: { recap: RecapResult }

export async function callRecapAgent(params: {
  runId:           string;
  playerId:        string;
  playerClass:     string;
  finalHp:         number;
  floorsCompleted: number;
  died:            boolean;
  gold:            number;
  playStyle:       string;
  eventLog:        string[];
  inventory:       string[];
}): Promise<RecapResponse> {
  return post<RecapResponse>('/recap', params);
}
```

---

## 6. Firebase Client — `src/services/firebase.ts`

```typescript
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { PlayerProfile, RunState } from '../models/types';

// Replace with your actual Firebase project config
const firebaseConfig = {
  apiKey:            'AIza...',
  authDomain:        'realm-explorer-xxxxx.firebaseapp.com',
  projectId:         'realm-explorer-xxxxx',
  storageBucket:     'realm-explorer-xxxxx.appspot.com',
  messagingSenderId: '123456789',
  appId:             '1:123456789:web:abcdef',
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

export const db = getFirestore();

// ─── Player profile ───────────────────────────────────────────────────────────

export async function getPlayerProfile(
  playerId: string,
): Promise<PlayerProfile | null> {
  const snap = await getDoc(doc(db, 'players', playerId));
  return snap.exists() ? (snap.data() as PlayerProfile) : null;
}

export async function savePlayerProfile(
  playerId: string,
  data: Partial<PlayerProfile>,
): Promise<void> {
  await setDoc(doc(db, 'players', playerId), data, { merge: true });
}

// ─── Run state ────────────────────────────────────────────────────────────────
// The backend writes all agent data to Firestore. The frontend only writes
// the initial run document when a new run starts.

export async function createRunDocument(run: RunState): Promise<void> {
  await setDoc(doc(db, 'runs', run.runId), {
    ...run,
    startedAt: serverTimestamp(),
  });
}
```

---

## 7. Zustand Store — `src/store/gameStore.ts`

```typescript
import { create } from 'zustand';
import {
  RunState,
  Encounter,
  GameItem,
  PlayerProfile,
  PlayStyle,
} from '../models/types';

// ─── Play style derivation (pure function — lives here, used by EncounterScreen)

export function derivePlayStyle(actionHistory: string[]): PlayStyle {
  if (actionHistory.length === 0) return 'cautious'; // default on Floor 1

  const last8   = actionHistory.slice(-8);
  const attacks = last8.filter(a => a.toLowerCase().includes('attack')).length;
  const negs    = last8.filter(a => a.toLowerCase().includes('negotiat')).length;
  const flees   = last8.filter(a => a.toLowerCase().includes('flee') ||
                                     a.toLowerCase().includes('retreat')).length;

  if (attacks >= 4) return 'aggressive';
  if (negs    >= 3) return 'diplomatic';
  if (flees   >= 3) return 'cautious';
  return 'unpredictable';
}

// ─── Store shape ──────────────────────────────────────────────────────────────

interface GameStore {
  // Active run
  run:              RunState | null;
  currentEncounter: Encounter | null;
  enemyHp:          number;          // tracked client-side per encounter
  combatTurns:      number;          // tracked client-side per encounter

  // Agent call state
  isThinking:       boolean;
  thinkingMessage:  string;

  // Player profile (persists across runs)
  profile:          PlayerProfile | null;

  // Actions
  setRun:               (run: RunState) => void;
  updateRun:            (updates: Partial<RunState>) => void;
  setCurrentEncounter:  (encounter: Encounter) => void;
  clearEncounter:       () => void;
  addToInventory:       (item: GameItem) => void;
  applyHpDelta:         (delta: number) => void;
  setEnemyHp:           (hp: number) => void;
  incrementCombatTurns: () => void;
  resetCombatTurns:     () => void;
  setThinking:          (on: boolean, message?: string) => void;
  setProfile:           (profile: PlayerProfile) => void;
  resetRun:             () => void;
  advanceFloor:         () => void;
  addEventLog:          (entry: string) => void;
  appendAction:         (action: string) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  run:              null,
  currentEncounter: null,
  enemyHp:          6,
  combatTurns:      0,
  isThinking:       false,
  thinkingMessage:  'The Dungeon Master is thinking...',
  profile:          null,

  setRun: (run) => set({ run }),

  updateRun: (updates) =>
    set((s) => ({ run: s.run ? { ...s.run, ...updates } : null })),

  setCurrentEncounter: (encounter) =>
    set({ currentEncounter: encounter, enemyHp: 6, combatTurns: 0 }),

  clearEncounter: () => set({ currentEncounter: null }),

  addToInventory: (item) =>
    set((s) => ({
      run: s.run
        ? { ...s.run, inventory: [...s.run.inventory, item] }
        : null,
    })),

  applyHpDelta: (delta) =>
    set((s) => ({
      run: s.run
        ? { ...s.run, hp: Math.max(0, s.run.hp + delta) }
        : null,
    })),

  setEnemyHp: (hp) => set({ enemyHp: hp }),

  incrementCombatTurns: () =>
    set((s) => ({ combatTurns: s.combatTurns + 1 })),

  resetCombatTurns: () => set({ combatTurns: 0 }),

  setThinking: (on, message) =>
    set({
      isThinking:      on,
      thinkingMessage: message ?? 'The Dungeon Master is thinking...',
    }),

  setProfile: (profile) => set({ profile }),

  resetRun: () =>
    set({ run: null, currentEncounter: null, enemyHp: 6, combatTurns: 0 }),

  advanceFloor: () =>
    set((s) => ({
      run: s.run
        ? { ...s.run, currentFloor: s.run.currentFloor + 1 }
        : null,
      currentEncounter: null,
      enemyHp:          6,
      combatTurns:      0,
    })),

  addEventLog: (entry) =>
    set((s) => ({
      run: s.run
        ? { ...s.run, eventLog: [...s.run.eventLog, entry] }
        : null,
    })),

  appendAction: (action) =>
    set((s) => {
      if (!s.run) return {};
      const newHistory  = [...s.run.actionHistory, action];
      const newStyle    = derivePlayStyle(newHistory);
      return {
        run: { ...s.run, actionHistory: newHistory, playStyle: newStyle },
      };
    }),
}));
```

---

## 8. Components

### `src/components/DmThinkingPanel.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { COLOURS } from '../models/constants';

export default function DmThinkingPanel() {
  const { thinkingMessage } = useGameStore();
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Animated.View style={[s.dot, { opacity: pulse }]} />
        <Text style={s.headerText}>The Dungeon Master is thinking...</Text>
      </View>
      <Text style={s.body}>{thinkingMessage}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.88)',
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     COLOURS.accent,
    padding:         18,
    margin:          16,
  },
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            8,
    marginBottom:   10,
  },
  dot: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: COLOURS.accent,
  },
  headerText: {
    color:      COLOURS.accent,
    fontSize:   13,
    fontWeight: '600',
  },
  body: {
    color:      '#B0C4B0',
    fontSize:   13,
    lineHeight: 22,
  },
});
```

### `src/components/StatBar.tsx`

```typescript
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLOURS } from '../models/constants';

interface Props {
  hp:      number;
  maxHp:   number;
  floor:   number;
  gold:    number;
}

export default function StatBar({ hp, maxHp, floor, gold }: Props) {
  const pct      = Math.max(0, hp / maxHp);
  const animPct  = useRef(new Animated.Value(pct)).current;
  const barColor = pct > 0.6 ? COLOURS.accent
                 : pct > 0.3 ? COLOURS.amber
                 : COLOURS.danger;

  useEffect(() => {
    Animated.spring(animPct, {
      toValue:         pct,
      useNativeDriver: false,
      friction:        6,
    }).start();
  }, [pct]);

  const width = animPct.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={s.container}>
      <View style={s.row}>
        <Text style={s.label}>HP</Text>
        <View style={s.track}>
          <Animated.View style={[s.fill, { width, backgroundColor: barColor }]} />
        </View>
        <Text style={s.hpText}>{hp}/{maxHp}</Text>
      </View>
      <View style={s.badges}>
        <View style={s.badge}>
          <Text style={s.badgeText}>Floor {floor} / 5</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>{gold} gold</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { marginBottom: 20 },
  row:        { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  label:      { color: COLOURS.textMuted, fontSize: 11, width: 22 },
  track:      {
    flex:            1,
    height:          8,
    backgroundColor: COLOURS.surface,
    borderRadius:    4,
    overflow:        'hidden',
  },
  fill:       { height: '100%', borderRadius: 4 },
  hpText:     { color: COLOURS.textPrimary, fontSize: 12, fontWeight: '600', width: 38, textAlign: 'right' },
  badges:     { flexDirection: 'row', gap: 10 },
  badge:      {
    backgroundColor: COLOURS.surface,
    borderRadius:    20,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:     1,
    borderColor:     COLOURS.border,
  },
  badgeText:  { color: COLOURS.textSecond, fontSize: 12 },
});
```

### `src/components/ActionButton.tsx`

```typescript
import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, Animated
} from 'react-native';
import { COLOURS } from '../models/constants';

interface Props {
  label:    string;
  onPress:  () => void;
  disabled: boolean;
  index:    number;         // for stagger animation delay
}

export default function ActionButton({ label, onPress, disabled, index }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.96, useNativeDriver: true, friction: 8,
    }).start();
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, friction: 8,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }], marginBottom: 10 }}>
      <TouchableOpacity
        style={[s.btn, disabled && s.disabled]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.85}
      >
        <Text style={[s.label, disabled && s.labelDisabled]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  btn: {
    backgroundColor: COLOURS.surface,
    borderRadius:    10,
    padding:         16,
    borderWidth:     1,
    borderColor:     COLOURS.border,
  },
  disabled:     { opacity: 0.4 },
  label:        { color: COLOURS.textPrimary, fontSize: 16, fontWeight: '500' },
  labelDisabled:{ color: COLOURS.textSecond },
});
```

### `src/components/ItemCard.tsx`

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameItem } from '../models/types';
import { COLOURS } from '../models/constants';

const TYPE_COLOURS: Record<string, string> = {
  weapon:     '#D85A30',
  armor:      '#534AB7',
  ring:       '#BA7517',
  consumable: '#1D9E75',
};

interface Props {
  item:        GameItem;
  onPress?:    () => void;
  showBuyBtn?: boolean;
  gold?:       number;
}

export default function ItemCard({ item, onPress, showBuyBtn, gold }: Props) {
  const typeColour = TYPE_COLOURS[item.itemType] ?? COLOURS.accent;

  return (
    <View style={[s.card, { borderLeftColor: typeColour }]}>
      <View style={s.top}>
        <Text style={s.name}>{item.itemName}</Text>
        <View style={[s.typeBadge, { backgroundColor: typeColour + '22' }]}>
          <Text style={[s.typeText, { color: typeColour }]}>{item.itemType}</Text>
        </View>
      </View>
      <Text style={s.effect}>{item.itemEffect}</Text>
      <Text style={s.styleNote}>{item.styleNote}</Text>
      <Text style={s.flavor}>"{item.flavorText}"</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLOURS.surface,
    borderRadius:    10,
    padding:         14,
    marginBottom:    12,
    borderLeftWidth: 3,
    borderLeftColor: COLOURS.accent,
  },
  top: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   8,
  },
  name:       { color: COLOURS.textPrimary, fontSize: 16, fontWeight: '600', flex: 1 },
  typeBadge:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  typeText:   { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  effect:     { color: COLOURS.textPrimary, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  styleNote:  { color: COLOURS.textSecond, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  flavor:     { color: COLOURS.textMuted, fontSize: 12, fontStyle: 'italic' },
});
```

---

## 9. Screens

### `src/screens/HomeScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { v4 as uuid } from 'uuid';
import { useGameStore } from '../store/gameStore';
import { getPlayerProfile, savePlayerProfile } from '../services/firebase';
import { pingHealth } from '../services/api';
import { COLOURS, CLASSES } from '../models/constants';

export default function HomeScreen() {
  const navigation           = useNavigation<any>();
  const { profile, setProfile, resetRun } = useGameStore();
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);

  // On mount: load or create player profile + warm up Cloud Function
  useEffect(() => {
    async function init() {
      setLoading(true);

      // 1. Get or create persistent playerId
      let playerId = await AsyncStorage.getItem('playerId');
      if (!playerId) {
        playerId = `player_${uuid().slice(0, 8)}`;
        await AsyncStorage.setItem('playerId', playerId);
      }

      // 2. Load Firestore profile
      let prof = await getPlayerProfile(playerId);
      if (!prof) {
        prof = {
          playerId,
          runsCompleted:   0,
          averageStyle:    'cautious',
          favoriteClass:   'shadow_rogue',
          bestDepth:       0,
          allTimeTitles:   [],
          unlockedClasses: ['shadow_rogue'],
        };
        await savePlayerProfile(playerId, prof);
      }
      setProfile(prof);

      setLoading(false);

      // 3. Warm up Cloud Function in background (prevents cold-start lag on Floor 1)
      setWarming(true);
      await pingHealth().catch(() => null);
      setWarming(false);
    }
    init();
    resetRun();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator color={COLOURS.accent} size="large" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  const favClass = CLASSES.find(c => c.id === profile?.favoriteClass);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Realm Explorer</Text>
          <Text style={s.sub}>Agentic Dungeon Crawler</Text>
          {warming && (
            <View style={s.warmRow}>
              <ActivityIndicator color={COLOURS.accent} size="small" />
              <Text style={s.warmText}>Summoning the dungeon...</Text>
            </View>
          )}
        </View>

        {/* Profile card */}
        {profile && (
          <View style={s.profileCard}>
            <Text style={s.cardLabel}>Explorer Profile</Text>
            <View style={s.statGrid}>
              <View style={s.stat}>
                <Text style={s.statVal}>{profile.runsCompleted}</Text>
                <Text style={s.statKey}>Runs</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>{profile.bestDepth}/5</Text>
                <Text style={s.statKey}>Best Depth</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statVal}>{favClass?.name ?? '—'}</Text>
                <Text style={s.statKey}>Favourite</Text>
              </View>
            </View>

            {/* Titles */}
            {profile.allTimeTitles.length > 0 && (
              <View style={s.titlesRow}>
                {profile.allTimeTitles.slice(-3).map((t, i) => (
                  <View key={i} style={s.titleBadge}>
                    <Text style={s.titleText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Start button */}
        <TouchableOpacity
          style={s.startBtn}
          onPress={() => navigation.navigate('ClassSelect')}
        >
          <Text style={s.startText}>Enter the Dungeon</Text>
        </TouchableOpacity>

        <Text style={s.hint}>
          AI-powered · Every run is unique · Powered by Gemini
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: COLOURS.bg },
  content:     { padding: 24, paddingBottom: 40 },
  header:      { alignItems: 'center', marginBottom: 32, marginTop: 20 },
  title:       { color: COLOURS.textPrimary, fontSize: 32, fontWeight: '700', letterSpacing: 1 },
  sub:         { color: COLOURS.textSecond, fontSize: 14, marginTop: 4 },
  warmRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  warmText:    { color: COLOURS.textMuted, fontSize: 12 },
  profileCard: {
    backgroundColor: COLOURS.surface,
    borderRadius:    12,
    padding:         20,
    marginBottom:    28,
    borderWidth:     1,
    borderColor:     COLOURS.border,
  },
  cardLabel:   { color: COLOURS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 },
  statGrid:    { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stat:        { alignItems: 'center' },
  statVal:     { color: COLOURS.textPrimary, fontSize: 22, fontWeight: '600' },
  statKey:     { color: COLOURS.textSecond, fontSize: 11, marginTop: 2 },
  titlesRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  titleBadge:  {
    backgroundColor: COLOURS.accent + '22',
    borderRadius:    20,
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderWidth:     1,
    borderColor:     COLOURS.accent,
  },
  titleText:   { color: COLOURS.accent, fontSize: 12 },
  startBtn:    {
    backgroundColor: COLOURS.accent,
    borderRadius:    12,
    padding:         18,
    alignItems:      'center',
    marginBottom:    16,
  },
  startText:   { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  hint:        { color: COLOURS.textMuted, fontSize: 11, textAlign: 'center' },
});
```

---

### `src/screens/ClassSelectScreen.tsx`

```typescript
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { v4 as uuid } from 'uuid';
import { useGameStore } from '../store/gameStore';
import { createRunDocument } from '../services/firebase';
import { COLOURS, CLASSES } from '../models/constants';
import { ClassDefinition, RunState } from '../models/types';

export default function ClassSelectScreen() {
  const navigation           = useNavigation<any>();
  const { setRun, profile }  = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  async function handleStart() {
    if (!selected || starting) return;
    setStarting(true);

    const chosenClass = CLASSES.find(c => c.id === selected)!;
    const playerId    = (await AsyncStorage.getItem('playerId')) ?? `player_${uuid().slice(0,8)}`;
    const runId       = `run_${uuid().slice(0, 8)}`;

    const newRun: RunState = {
      runId,
      playerId,
      playerClass:   chosenClass.id,
      hp:            chosenClass.startingHp,
      maxHp:         chosenClass.startingHp,
      gold:          0,
      currentFloor:  1,
      playStyle:     chosenClass.playStyle,
      actionHistory: [],
      eventLog:      [],
      inventory:     [],
      status:        'active',
    };

    setRun(newRun);
    await createRunDocument(newRun).catch(() => null); // best-effort
    setStarting(false);
    navigation.navigate('Encounter');
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Choose Your Class</Text>
        <Text style={s.sub}>
          Your class shapes how the Dungeon Master builds your world.
        </Text>

        {CLASSES.map((cls) => (
          <ClassCard
            key={cls.id}
            cls={cls}
            selected={selected === cls.id}
            onPress={() => setSelected(cls.id)}
          />
        ))}

        <TouchableOpacity
          style={[s.startBtn, (!selected || starting) && s.btnDisabled]}
          onPress={handleStart}
          disabled={!selected || starting}
        >
          <Text style={s.startText}>
            {starting ? 'Entering...' : 'Enter the Dungeon'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ClassCard({
  cls, selected, onPress,
}: { cls: ClassDefinition; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[s.card, selected && { borderColor: cls.colourAccent, borderWidth: 2 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={s.cardTop}>
        <Text style={[s.className, selected && { color: cls.colourAccent }]}>
          {cls.name}
        </Text>
        <View style={[s.styleBadge, { backgroundColor: cls.colourAccent + '22' }]}>
          <Text style={[s.styleText, { color: cls.colourAccent }]}>{cls.playStyle}</Text>
        </View>
      </View>
      <Text style={s.desc}>{cls.description}</Text>
      <View style={s.abilityRow}>
        <Text style={s.abilityLabel}>Ability: </Text>
        <Text style={s.abilityName}>{cls.ability} </Text>
        <Text style={s.abilityDesc}>— {cls.abilityDesc}</Text>
      </View>
      <View style={s.hpRow}>
        <Text style={s.hpLabel}>Starting HP</Text>
        <Text style={[s.hpVal, { color: cls.colourAccent }]}>{cls.startingHp}</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: COLOURS.bg },
  content:    { padding: 24, paddingBottom: 40 },
  title:      { color: COLOURS.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 8 },
  sub:        { color: COLOURS.textSecond, fontSize: 14, lineHeight: 22, marginBottom: 28 },
  card: {
    backgroundColor: COLOURS.surface,
    borderRadius:    12,
    padding:         18,
    marginBottom:    14,
    borderWidth:     1,
    borderColor:     COLOURS.border,
  },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  className:  { color: COLOURS.textPrimary, fontSize: 18, fontWeight: '600' },
  styleBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  styleText:  { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  desc:       { color: COLOURS.textSecond, fontSize: 13, lineHeight: 20, marginBottom: 12 },
  abilityRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  abilityLabel:{ color: COLOURS.textMuted, fontSize: 12 },
  abilityName: { color: COLOURS.textPrimary, fontSize: 12, fontWeight: '600' },
  abilityDesc: { color: COLOURS.textSecond, fontSize: 12 },
  hpRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hpLabel:    { color: COLOURS.textMuted, fontSize: 12 },
  hpVal:      { fontSize: 18, fontWeight: '700' },
  startBtn:   {
    backgroundColor: COLOURS.accent,
    borderRadius:    12,
    padding:         18,
    alignItems:      'center',
    marginTop:       10,
  },
  btnDisabled:{ opacity: 0.5 },
  startText:  { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
```

---

### `src/screens/EncounterScreen.tsx`

This is the core screen. It calls `dmAgent` to load each floor, then `rivalAgent`
after each player action. It handles all floor-routing logic.

```typescript
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { callDmAgent, callRivalAgent, callLootAgent } from '../services/api';
import { COLOURS, FLOOR_CONFIG } from '../models/constants';
import DmThinkingPanel from '../components/DmThinkingPanel';
import StatBar from '../components/StatBar';
import ActionButton from '../components/ActionButton';
import ItemCard from '../components/ItemCard';
import { GameItem } from '../models/types';

export default function EncounterScreen() {
  const navigation   = useNavigation<any>();
  const store        = useGameStore();
  const { run, currentEncounter, isThinking, enemyHp, combatTurns } = store;

  const [resolving,    setResolving]    = useState(false);
  const [outcomeText,  setOutcomeText]  = useState<string | null>(null);
  const [lootItem,     setLootItem]     = useState<GameItem | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  // Load encounter when screen mounts or floor changes
  useEffect(() => {
    if (!currentEncounter && run) {
      loadEncounter();
    }
  }, [run?.currentFloor]);

  async function loadEncounter() {
    if (!run) return;

    // Floor 4 → Merchant
    if (run.currentFloor === 4) {
      navigation.replace('Merchant');
      return;
    }

    store.setThinking(true,
      `Analysing your play style: ${run.playStyle}.\n` +
      `Generating Floor ${run.currentFloor} encounter...`
    );

    try {
      const { encounter } = await callDmAgent({
        runId:         run.runId,
        playerId:      run.playerId,
        floorNumber:   run.currentFloor,
        playerClass:   run.playerClass,
        hp:            run.hp,
        maxHp:         run.maxHp,
        playStyle:     run.playStyle,
        actionHistory: run.actionHistory,
        eventLog:      run.eventLog,
      });

      store.setCurrentEncounter(encounter);
      store.setEnemyHp(encounter.difficultyWeight * 2); // local enemy HP estimate
    } catch (e) {
      Alert.alert('Connection Lost', 'Could not reach the dungeon. Try again.', [
        { text: 'Retry', onPress: loadEncounter },
      ]);
    } finally {
      store.setThinking(false);
    }
  }

  async function handleAction(action: string) {
    if (!run || !currentEncounter || resolving) return;
    setResolving(true);
    setOutcomeText(null);
    setLootItem(null);

    store.appendAction(action);
    store.setThinking(true,
      `Player chose: "${action}".\nResolving outcome with Rival Agent...`
    );

    try {
      const { combat } = await callRivalAgent({
        runId:        run.runId,
        enemyName:    currentEncounter.enemyName,
        enemyType:    currentEncounter.enemyType,
        enemyHp:      enemyHp,
        playerAction: action,
        playerHp:     run.hp,
        playerClass:  run.playerClass,
        combatTurns,
      });

      store.setThinking(false);
      store.incrementCombatTurns();

      // Apply HP deltas
      store.applyHpDelta(combat.playerHpDelta);
      store.setEnemyHp(Math.max(0, enemyHp + combat.enemyHpDelta));
      setOutcomeText(combat.outcomeText);

      // Log event
      const logEntry = `Floor ${run.currentFloor}: ${action} vs ${currentEncounter.enemyName} — ${combat.winQuality}`;
      store.addEventLog(logEntry);

      // Player died
      if (run.hp + combat.playerHpDelta <= 0) {
        store.updateRun({ status: 'died' });
        setTimeout(() => navigation.replace('Recap'), 1800);
        return;
      }

      // Combat over — player won
      if (combat.combatOver && combat.playerWon) {
        await handleFloorWin(combat.winQuality);
        return;
      }

      // Combat continues (multi-turn)
      setResolving(false);

    } catch (e) {
      store.setThinking(false);
      setResolving(false);
      Alert.alert('Error', 'Something went wrong resolving that action.');
    }
  }

  async function handleFloorWin(winQuality: string) {
    if (!run) return;

    store.setThinking(true, 'Generating your reward...');

    try {
      const { item } = await callLootAgent({
        runId:       run.runId,
        playerId:    run.playerId,
        playerClass: run.playerClass,
        playStyle:   run.playStyle,
        floorNumber: run.currentFloor,
        winQuality,
        eventLog:    run.eventLog,
      });

      store.setThinking(false);
      store.addToInventory(item);
      store.updateRun({ gold: run.gold + Math.floor(Math.random() * 8) + 5 });
      setLootItem(item);
      setResolving(false);

    } catch {
      store.setThinking(false);
      setResolving(false);
      proceedToNextFloor();
    }
  }

  function proceedToNextFloor() {
    if (!run) return;
    if (run.currentFloor >= 5) {
      store.updateRun({ status: 'completed' });
      navigation.replace('Recap');
    } else {
      store.advanceFloor();
    }
  }

  if (!run) return null;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>

        <StatBar hp={run.hp} maxHp={run.maxHp} floor={run.currentFloor} gold={run.gold} />

        {isThinking && <DmThinkingPanel />}

        {!isThinking && currentEncounter && (
          <>
            {/* Floor badge */}
            <View style={s.floorBadge}>
              <Text style={s.floorText}>
                {FLOOR_CONFIG[run.currentFloor as keyof typeof FLOOR_CONFIG]?.label}
              </Text>
            </View>

            {/* Encounter narrative */}
            <Text style={s.encounterTitle}>{currentEncounter.encounterTitle}</Text>
            <Text style={s.narrative}>{currentEncounter.narrativeText}</Text>

            {/* Enemy box */}
            <View style={s.enemyBox}>
              <Text style={s.enemyLabel}>You face</Text>
              <Text style={s.enemyName}>{currentEncounter.enemyName}</Text>
              <View style={s.enemyHpRow}>
                <Text style={s.enemyHpLabel}>Enemy HP</Text>
                <View style={s.enemyHpTrack}>
                  <View style={[s.enemyHpFill,
                    { width: `${Math.min(100, (enemyHp / 10) * 100)}%` }]} />
                </View>
              </View>
            </View>

            {/* Outcome text (after action resolves) */}
            {outcomeText && (
              <View style={s.outcomeBox}>
                <Text style={s.outcomeText}>{outcomeText}</Text>
              </View>
            )}

            {/* Loot item after floor win */}
            {lootItem && (
              <View style={s.lootSection}>
                <Text style={s.lootHeader}>Floor Cleared — You found:</Text>
                <ItemCard item={lootItem} />
                <TouchableOpacity style={s.nextBtn} onPress={proceedToNextFloor}>
                  <Text style={s.nextBtnText}>
                    {run.currentFloor >= 5 ? 'End Run' : 'Next Floor →'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Action buttons */}
            {!lootItem && (
              <>
                <Text style={s.actionsLabel}>What do you do?</Text>
                {currentEncounter.availableActions.map((action, i) => (
                  <ActionButton
                    key={action}
                    label={action}
                    onPress={() => handleAction(action)}
                    disabled={resolving}
                    index={i}
                  />
                ))}
              </>
            )}

            {/* DM Reasoning panel (collapsible) */}
            <TouchableOpacity
              style={s.reasoningToggle}
              onPress={() => setShowReasoning(v => !v)}
            >
              <Text style={s.reasoningToggleText}>
                {showReasoning ? '▲ Hide DM Reasoning' : '▼ Show DM Reasoning'}
              </Text>
            </TouchableOpacity>

            {showReasoning && (
              <View style={s.reasoningBox}>
                <Text style={s.reasoningLabel}>DM Agent Reasoning</Text>
                <Text style={s.reasoningText}>{currentEncounter.dmReasoning}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLOURS.bg },
  scroll:         { flex: 1 },
  content:        { padding: 20, paddingBottom: 50 },
  floorBadge:     {
    backgroundColor: COLOURS.accent + '22',
    borderRadius:    20,
    paddingHorizontal: 14,
    paddingVertical:   6,
    alignSelf:       'flex-start',
    marginBottom:    16,
    borderWidth:     1,
    borderColor:     COLOURS.accent,
  },
  floorText:      { color: COLOURS.accent, fontSize: 12, fontWeight: '600' },
  encounterTitle: { color: COLOURS.textPrimary, fontSize: 22, fontWeight: '600', marginBottom: 12 },
  narrative:      { color: COLOURS.textSecond, fontSize: 15, lineHeight: 24, marginBottom: 24 },
  enemyBox: {
    backgroundColor: '#2A1A3E',
    borderRadius:    12,
    padding:         16,
    marginBottom:    24,
    borderLeftWidth: 3,
    borderLeftColor: COLOURS.danger,
  },
  enemyLabel:     { color: '#888', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  enemyName:      { color: '#FF8B60', fontSize: 18, fontWeight: '600', marginTop: 4, marginBottom: 10 },
  enemyHpRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  enemyHpLabel:   { color: '#888', fontSize: 11, width: 60 },
  enemyHpTrack:   { flex: 1, height: 6, backgroundColor: COLOURS.surface, borderRadius: 3, overflow: 'hidden' },
  enemyHpFill:    { height: '100%', backgroundColor: COLOURS.danger, borderRadius: 3 },
  outcomeBox: {
    backgroundColor: COLOURS.surface,
    borderRadius:    10,
    padding:         14,
    marginBottom:    20,
    borderWidth:     1,
    borderColor:     COLOURS.border,
  },
  outcomeText:    { color: COLOURS.textPrimary, fontSize: 14, lineHeight: 22 },
  lootSection:    { marginBottom: 20 },
  lootHeader:     { color: COLOURS.accent, fontSize: 14, fontWeight: '600', marginBottom: 12 },
  nextBtn: {
    backgroundColor: COLOURS.accent,
    borderRadius:    10,
    padding:         16,
    alignItems:      'center',
    marginTop:       8,
  },
  nextBtnText:    { color: '#FFF', fontSize: 16, fontWeight: '600' },
  actionsLabel:   {
    color: '#888', fontSize: 12, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 12,
  },
  reasoningToggle:{ paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  reasoningToggleText: { color: COLOURS.textMuted, fontSize: 12 },
  reasoningBox: {
    backgroundColor: '#0D0D1A',
    borderRadius:    10,
    padding:         14,
    borderWidth:     1,
    borderColor:     '#2A2A4E',
    marginBottom:    20,
  },
  reasoningLabel: {
    color: '#444', fontSize: 10, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 6,
  },
  reasoningText:  { color: '#555', fontSize: 12, lineHeight: 20, fontStyle: 'italic' },
});
```

---

### `src/screens/MerchantScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { callMerchantAgent } from '../services/api';
import { GameItem } from '../models/types';
import { COLOURS } from '../models/constants';
import DmThinkingPanel from '../components/DmThinkingPanel';
import ItemCard from '../components/ItemCard';

const ITEM_PRICE = 15;

export default function MerchantScreen() {
  const navigation = useNavigation<any>();
  const store      = useGameStore();
  const { run, isThinking } = store;
  const [items, setItems] = useState<GameItem[]>([]);
  const [bought, setBought] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadMerchant();
  }, []);

  async function loadMerchant() {
    if (!run) return;
    store.setThinking(true, 'The merchant is preparing their wares...\nGenerating 3 personalised items.');

    try {
      const { items: merchantItems } = await callMerchantAgent({
        runId:       run.runId,
        playerId:    run.playerId,
        playerClass: run.playerClass,
        playStyle:   run.playStyle,
        floorNumber: 4,
        winQuality:  'close',   // use last known quality or default
        eventLog:    run.eventLog,
      });
      setItems(merchantItems);
    } catch {
      Alert.alert('Merchant Unavailable', 'The merchant has nothing to show today.');
    } finally {
      store.setThinking(false);
    }
  }

  function handleBuy(item: GameItem, index: number) {
    if (!run || run.gold < ITEM_PRICE) {
      Alert.alert('Not Enough Gold', `You need ${ITEM_PRICE} gold.`);
      return;
    }
    store.addToInventory(item);
    store.updateRun({ gold: run.gold - ITEM_PRICE });
    store.addEventLog(`Floor 4: Purchased ${item.itemName} from merchant`);
    setBought(prev => new Set([...prev, index]));
  }

  function handleLeave() {
    store.advanceFloor();
    navigation.replace('Encounter');
  }

  if (!run) return null;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>

        {/* Header */}
        <View style={s.header}>
          <View style={s.floorBadge}>
            <Text style={s.floorText}>Floor 4 — Merchant</Text>
          </View>
          <Text style={s.title}>A Familiar Face</Text>
          <Text style={s.sub}>
            The merchant has three items — each chosen for the way you play.
          </Text>
          <View style={s.goldRow}>
            <Text style={s.goldLabel}>Your gold</Text>
            <Text style={s.goldVal}>{run.gold}</Text>
          </View>
        </View>

        {isThinking && <DmThinkingPanel />}

        {/* Items */}
        {!isThinking && items.map((item, i) => (
          <View key={i}>
            <ItemCard item={item} />
            {!bought.has(i) ? (
              <TouchableOpacity
                style={[s.buyBtn, run.gold < ITEM_PRICE && s.buyBtnDisabled]}
                onPress={() => handleBuy(item, i)}
                disabled={run.gold < ITEM_PRICE}
              >
                <Text style={s.buyBtnText}>{ITEM_PRICE} gold — Buy</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.boughtRow}>
                <Text style={s.boughtText}>✓ Added to inventory</Text>
              </View>
            )}
          </View>
        ))}

        {/* Leave */}
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
          <Text style={s.leaveBtnText}>Leave for Floor 5 →</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLOURS.bg },
  content:        { padding: 20, paddingBottom: 50 },
  header:         { marginBottom: 24 },
  floorBadge: {
    backgroundColor: COLOURS.amber + '22',
    borderRadius:    20,
    paddingHorizontal: 14,
    paddingVertical:   6,
    alignSelf:       'flex-start',
    marginBottom:    12,
    borderWidth:     1,
    borderColor:     COLOURS.amber,
  },
  floorText:      { color: COLOURS.amber, fontSize: 12, fontWeight: '600' },
  title:          { color: COLOURS.textPrimary, fontSize: 22, fontWeight: '600', marginBottom: 8 },
  sub:            { color: COLOURS.textSecond, fontSize: 14, lineHeight: 22, marginBottom: 12 },
  goldRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  goldLabel:      { color: COLOURS.textMuted, fontSize: 13 },
  goldVal:        { color: COLOURS.amber, fontSize: 20, fontWeight: '700' },
  buyBtn: {
    backgroundColor: COLOURS.accent,
    borderRadius:    10,
    padding:         14,
    alignItems:      'center',
    marginBottom:    20,
    marginTop:       -4,
  },
  buyBtnDisabled: { opacity: 0.4 },
  buyBtnText:     { color: '#FFF', fontSize: 15, fontWeight: '600' },
  boughtRow:      { alignItems: 'center', marginBottom: 20, marginTop: -4 },
  boughtText:     { color: COLOURS.accent, fontSize: 14, fontWeight: '600' },
  leaveBtn: {
    borderWidth:     1,
    borderColor:     COLOURS.border,
    borderRadius:    10,
    padding:         16,
    alignItems:      'center',
    marginTop:       8,
  },
  leaveBtnText:   { color: COLOURS.textSecond, fontSize: 15 },
});
```

---

### `src/screens/RecapScreen.tsx`

```typescript
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGameStore } from '../store/gameStore';
import { callRecapAgent } from '../services/api';
import { RecapResult } from '../models/types';
import { COLOURS } from '../models/constants';
import DmThinkingPanel from '../components/DmThinkingPanel';

export default function RecapScreen() {
  const navigation = useNavigation<any>();
  const store      = useGameStore();
  const { run, isThinking } = store;

  const [recap,      setRecap]      = useState<RecapResult | null>(null);
  const [displayed,  setDisplayed]  = useState('');   // typewriter effect
  const titleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadRecap();
  }, []);

  async function loadRecap() {
    if (!run) return;
    store.setThinking(true, 'The Recap Agent is writing your legend...\nThis may take a moment.');

    try {
      const { recap: result } = await callRecapAgent({
        runId:           run.runId,
        playerId:        run.playerId,
        playerClass:     run.playerClass,
        finalHp:         Math.max(0, run.hp),
        floorsCompleted: run.currentFloor - (run.status === 'died' ? 1 : 0),
        died:            run.status === 'died',
        gold:            run.gold,
        playStyle:       run.playStyle,
        eventLog:        run.eventLog,
        inventory:       run.inventory.map(i => i.itemName),
      });

      store.setThinking(false);
      setRecap(result);
      typewrite(result.narrativeText);
    } catch {
      store.setThinking(false);
      setRecap({
        narrativeText: 'Your run ended in darkness, but the dungeon remembers your name.',
        runTitle:      'The Unknown Wanderer',
      });
    }
  }

  // Character-by-character typewriter
  function typewrite(text: string) {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        // Fade in the title badge after text completes
        Animated.timing(titleOpacity, {
          toValue: 1, duration: 800, useNativeDriver: true,
        }).start();
      }
    }, 22); // ~22ms per character → ~4 words/sec
  }

  function handlePlayAgain() {
    store.resetRun();
    navigation.replace('ClassSelect');
  }

  if (!run) return null;

  const died      = run.status === 'died';
  const floors    = run.currentFloor - (died ? 1 : 0);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>

        <View style={s.resultBadge}>
          <Text style={[s.resultText, { color: died ? COLOURS.danger : COLOURS.accent }]}>
            {died ? 'Fallen' : 'Victorious'}
          </Text>
        </View>

        {isThinking && <DmThinkingPanel />}

        {/* Story text */}
        {!isThinking && recap && (
          <>
            <Text style={s.narrative}>{displayed}</Text>

            {/* Run title — fades in after typewriter */}
            <Animated.View style={[s.titleCard, { opacity: titleOpacity }]}>
              <Text style={s.titleLabel}>Your title</Text>
              <Text style={s.runTitle}>{recap.runTitle}</Text>
            </Animated.View>

            {/* Run stats */}
            <View style={s.statsGrid}>
              <StatChip label="Class"   value={run.playerClass.replace('_', ' ')} />
              <StatChip label="Floors"  value={`${floors}/5`} />
              <StatChip label="Style"   value={run.playStyle} />
              <StatChip label="Gold"    value={`${run.gold}`} />
              <StatChip label="Items"   value={`${run.inventory.length}`} />
              <StatChip label="HP Left" value={`${Math.max(0, run.hp)}`} />
            </View>

            {/* Inventory */}
            {run.inventory.length > 0 && (
              <View style={s.inventorySection}>
                <Text style={s.inventoryLabel}>Items Carried</Text>
                {run.inventory.map((item, i) => (
                  <Text key={i} style={s.inventoryItem}>· {item.itemName}</Text>
                ))}
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity style={s.playAgainBtn} onPress={handlePlayAgain}>
              <Text style={s.playAgainText}>Run Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.homeBtn}
              onPress={() => { store.resetRun(); navigation.replace('Home'); }}
            >
              <Text style={s.homeBtnText}>Return to Home</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={chip.container}>
      <Text style={chip.val}>{value}</Text>
      <Text style={chip.label}>{label}</Text>
    </View>
  );
}

const chip = StyleSheet.create({
  container: {
    backgroundColor: COLOURS.surface,
    borderRadius:    10,
    padding:         12,
    alignItems:      'center',
    flex:            1,
    minWidth:        '30%',
    borderWidth:     1,
    borderColor:     COLOURS.border,
  },
  val:   { color: COLOURS.textPrimary, fontSize: 16, fontWeight: '600' },
  label: { color: COLOURS.textMuted,   fontSize: 11, marginTop: 2 },
});

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: COLOURS.bg },
  content:        { padding: 24, paddingBottom: 50 },
  resultBadge: {
    alignSelf:    'flex-start',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical:   6,
    borderWidth:  1,
    borderColor:  COLOURS.border,
    marginBottom: 24,
  },
  resultText:     { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  narrative: {
    color:        COLOURS.textPrimary,
    fontSize:     16,
    lineHeight:   28,
    marginBottom: 28,
    minHeight:    120,
  },
  titleCard: {
    backgroundColor: COLOURS.surface,
    borderRadius:    12,
    padding:         20,
    alignItems:      'center',
    marginBottom:    24,
    borderWidth:     1,
    borderColor:     COLOURS.accent,
  },
  titleLabel:     { color: COLOURS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  runTitle:       { color: COLOURS.accent, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  inventorySection:{ marginBottom: 28 },
  inventoryLabel: { color: COLOURS.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  inventoryItem:  { color: COLOURS.textSecond, fontSize: 14, lineHeight: 24 },
  playAgainBtn: {
    backgroundColor: COLOURS.accent,
    borderRadius:    12,
    padding:         18,
    alignItems:      'center',
    marginBottom:    12,
  },
  playAgainText:  { color: '#FFF', fontSize: 18, fontWeight: '700' },
  homeBtn: {
    borderWidth:  1,
    borderColor:  COLOURS.border,
    borderRadius: 12,
    padding:      16,
    alignItems:   'center',
  },
  homeBtnText:    { color: COLOURS.textSecond, fontSize: 15 },
});
```

---

## 10. Navigation — `App.tsx`

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen        from './src/screens/HomeScreen';
import ClassSelectScreen from './src/screens/ClassSelectScreen';
import EncounterScreen   from './src/screens/EncounterScreen';
import MerchantScreen    from './src/screens/MerchantScreen';
import RecapScreen       from './src/screens/RecapScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle:   { backgroundColor: '#1A1A2E' },
          animationEnabled: true,
        }}
      >
        <Stack.Screen name="Home"        component={HomeScreen}        />
        <Stack.Screen name="ClassSelect" component={ClassSelectScreen} />
        <Stack.Screen name="Encounter"   component={EncounterScreen}   />
        <Stack.Screen name="Merchant"    component={MerchantScreen}    />
        <Stack.Screen name="Recap"       component={RecapScreen}       />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 11. Backend–Frontend Contract Reference

This table is the single source of truth for every API call.

| Screen | Function | Endpoint | Request Fields | Response Path |
|---|---|---|---|---|
| EncounterScreen | `callDmAgent()` | `POST /api/v1/dm` | runId, playerId, floorNumber, playerClass, hp, maxHp, playStyle, actionHistory, eventLog | `response.data.encounter` |
| EncounterScreen | `callRivalAgent()` | `POST /api/v1/rival` | runId, enemyName, enemyType, enemyHp, playerAction, playerHp, playerClass, combatTurns | `response.data.combat` |
| EncounterScreen | `callLootAgent()` | `POST /api/v1/loot` | ...+ `merchantMode: false` | `response.data.item` |
| MerchantScreen | `callMerchantAgent()` | `POST /api/v1/loot` | ...+ `merchantMode: true` | `response.data.items` (array) |
| RecapScreen | `callRecapAgent()` | `POST /api/v1/recap` | runId, playerId, playerClass, finalHp, floorsCompleted, died, gold, playStyle, eventLog, inventory | `response.data.recap` |

**Note on `maxHp`:** The backend's DM Agent uses `maxHp` to calculate the low-HP
threshold (`hp < maxHp * 0.3`). Always send both `hp` and `maxHp` in every
`callDmAgent` call. The `RunState` tracks `maxHp` separately from `hp`.
