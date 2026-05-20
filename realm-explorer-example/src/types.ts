/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlayStyleType = 'aggressive' | 'diplomatic' | 'cautious' | 'unpredictable';

export interface PlayerProfile {
  id: string;
  name: string;
  runsCount: number;
  highestFloor: number;
  totalGold: number;
  preferredClass?: string;
}

export interface CharacterClass {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  gold: number;
  ability: string;
  abilityDesc: string;
  accentColor: string; // Tailwind color class or hex (e.g., 'cyan', 'amber', 'rose')
  stats: {
    strength: number;
    intelligence: number;
    stealth: number;
  };
  startingInventory: string[];
}

export interface ActionChoice {
  id: string;
  text: string;
  style: PlayStyleType;
}

export interface Enemy {
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  baseDamage: number;
}

export interface DungeonEncounter {
  floorNumber: number;
  floorType: 'combat' | 'rift' | 'merchant' | 'boss';
  title: string;
  narrative: string;
  enemy?: Enemy;
  choices: ActionChoice[];
  illustrationSeed: string; // for consistent aesthetic styling
}

export interface CombatResult {
  outcomeText: string;
  playerHpDelta: number;
  enemyHpDelta: number;
  winQuality?: 'clean' | 'close' | 'messy';
  combatStatus: 'fighting' | 'player_won' | 'player_escaped' | 'player_died';
}

export interface LootItem {
  id: string;
  name: string;
  type: 'weapon' | 'potion' | 'relic' | 'armor';
  modifier: string;
  flavorText: string;
  price?: number;
}

export interface ActionHistoryItem {
  floor: number;
  description: string;
  choiceStyle: PlayStyleType;
}

export interface AnimationEvent {
  id: string;
  type: 'damage' | 'dodge' | 'heal' | 'slide_in' | 'shake' | 'loot_drop';
  payload: {
    value?: number;
    message?: string;
  };
  timestamp: number;
}

export interface RunState {
  runId: string;
  playerClass?: CharacterClass;
  currentHp: number;
  displayHp: number; // for delayed damage animations
  gold: number;
  floorNumber: number;
  turnCount: number;
  isDead: boolean;
  isFinished: boolean;
  actionHistory: ActionHistoryItem[];
  eventLog: string[];
  inventory: LootItem[];
  currentEncounter?: DungeonEncounter;
  pendingAnimations: AnimationEvent[];
}
