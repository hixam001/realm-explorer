// ─── Enums ────────────────────────────────────────────────────────────────────
export type PlayerClass    = 'blade_dancer' | 'ember_mage' | 'shadow_rogue';
export type PlayStyle      = 'aggressive' | 'diplomatic' | 'cautious' | 'unpredictable';
export type EnemyType      = string;
export type RunStatus      = 'active' | 'completed' | 'died';
export type ItemType       = 'weapon' | 'armor' | 'ring' | 'consumable' | 'relic' | 'potion';
export type WinQuality     = 'clean' | 'close' | 'messy';
export type ActionStyle    = 'aggressive' | 'diplomatic' | 'cautious' | 'unpredictable';
export type Screen         = 'home' | 'classSelect' | 'encounter' | 'merchant' | 'recap';

// ─── Player Profile ───────────────────────────────────────────────────────────
export interface PlayerProfile {
  playerId:        string;
  runsCompleted:   number;
  averageStyle:    string;
  favoriteClass:   PlayerClass;
  bestDepth:       number;
  allTimeTitles:   string[];
}

// ─── Character Class ──────────────────────────────────────────────────────────
export interface CharacterClass {
  id:           PlayerClass;
  name:         string;
  description:  string;
  lore:         string;
  playStyle:    PlayStyle;
  startingHp:   number;
  maxHp:        number;
  startingGold: number;
  ability:      string;
  abilityDesc:  string;
  accentColor:  string;
  glowColor:    string;
  icon:         string;
}

// ─── Encounter ────────────────────────────────────────────────────────────────
export interface DungeonEncounter {
  encounterTitle:   string;
  narrativeText:    string;
  enemyName:        string;
  enemyType:        EnemyType;
  availableActions: ActionChoice[];
  difficultyWeight: number;
  dmReasoning:      string;
}

export interface ActionChoice {
  label:  string;
  style:  ActionStyle;
}

// ─── Combat ───────────────────────────────────────────────────────────────────
export interface CombatResult {
  outcomeText:    string;
  playerHpDelta:  number;
  enemyHpDelta:   number;
  combatOver:     boolean;
  playerWon:      boolean;
  winQuality:     WinQuality;
  rivalReasoning: string;
}

export interface CombatLogEntry {
  type:    'narrative' | 'player' | 'outcome' | 'system';
  text:    string;
  style?:  ActionStyle;
}

// ─── Items ────────────────────────────────────────────────────────────────────
export interface GameItem {
  itemName:   string;
  itemEffect: string;
  styleNote:  string;
  flavorText: string;
  itemType:   ItemType;
  cost?:      number;
}

// ─── Run State ────────────────────────────────────────────────────────────────
export interface RunState {
  runId:         string;
  playerId:      string;
  playerClass:   PlayerClass;
  hp:            number;
  displayHp:     number;   // lags behind hp for hemorrhage animation
  maxHp:         number;
  gold:          number;
  currentFloor:  number;
  playStyle:     PlayStyle;
  actionHistory: ActionStyle[];
  eventLog:      string[];
  inventory:     GameItem[];
  status:        RunStatus;
}

// ─── Animation Queue ──────────────────────────────────────────────────────────
export interface AnimationEvent {
  type: 'screen_shake' | 'red_flash' | 'gold_pulse' | 'victory' | 'damage';
  intensity?: number;
}
