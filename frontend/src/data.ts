import { CharacterClass, DungeonEncounter, GameItem, PlayerProfile } from './types';

// ─── Character Classes — matching example exactly ─────────────────────────────
export const CLASSES: CharacterClass[] = [
  {
    id: 'blade_dancer', name: 'Blade Dancer',
    description: 'A swift melee fighter who excels in rapid combos and precision strikes.',
    lore: 'Trained in the lost arts of the Shadow Courts, blade dancers read the flow of combat like poetry.',
    playStyle: 'aggressive', startingHp: 100, maxHp: 100, startingGold: 50,
    ability: 'FLURRY', abilityDesc: 'Deal double damage on next strike, but take chip damage yourself.',
    accentColor: '#f43f5e', glowColor: 'rgba(244,63,94,0.3)', icon: '⚔️',
  },
  {
    id: 'ember_mage', name: 'Ember Mage',
    description: 'A tactical spellcaster who prefers high-risk, high-reward arcane plays.',
    lore: 'Ember Mages channel volatile fire magic — their power is immense, their control, questionable.',
    playStyle: 'unpredictable', startingHp: 80, maxHp: 80, startingGold: 80,
    ability: 'ARCANE BURST', abilityDesc: 'Area damage — needs one cooldown turn before reuse.',
    accentColor: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)', icon: '🔥',
  },
  {
    id: 'shadow_rogue', name: 'Shadow Rogue',
    description: 'A careful infiltrator who weaponizes deception, patience, and escape routes.',
    lore: 'They say a Shadow Rogue was never truly in the room — just their reputation.',
    playStyle: 'cautious', startingHp: 90, maxHp: 90, startingGold: 60,
    ability: 'VANISH', abilityDesc: 'Skip one encounter per floor with no HP cost.',
    accentColor: '#a855f7', glowColor: 'rgba(168,85,247,0.3)', icon: '🗡️',
  },
];

// ─── Campaign Encounters — matching example data exactly ──────────────────────
export const MOCK_ENCOUNTERS: DungeonEncounter[] = [
  {
    encounterTitle: 'Floor 1: The Cobalt Gatehouse',
    narrativeText: 'A heavy mechanical gateway hums with ancient energy. Before it stands a Cobalt Sentry, its single eye scanning the hallway for intruders. Steam vents from its iron joints. There is no going back; only through.',
    enemyName: 'Cobalt Sentry', enemyType: 'Automaton',
    availableActions: [
      { label: "Draw weapon and lunge directly at the machine's eye sensor.", style: 'aggressive' },
      { label: 'Show the standard faction mark and speak the bypass code.', style: 'diplomatic' },
      { label: "Observe its rotational sweep, timing your crawl beneath its sensor blindspot.", style: 'cautious' },
      { label: 'Throw a loose metal gear directly into its coolant exhaust pipe.', style: 'unpredictable' },
    ],
    difficultyWeight: 3,
    dmReasoning: 'Player is on Floor 1. Introduced a high-HP melee construct to test capabilities and establish tone. DifficultyWeight 3 reflects standard entry challenge.',
  },
  {
    encounterTitle: 'Floor 2: The Chrono-Fractured Cleft',
    narrativeText: 'A strange crack in space-time hovers in the air, glowing with brilliant amethyst ripples. Shards of ancient cobblestone float suspended around it. You feel your weapons vibrate. A spatial rift stands in your absolute path.',
    enemyName: 'Spatial Rift', enemyType: 'Anomaly',
    availableActions: [
      { label: 'Shatter the rift core with a concentrated energy strike.', style: 'aggressive' },
      { label: 'Attune yourself to the temporal frequency and step through.', style: 'diplomatic' },
      { label: 'Carefully rig a grounding wire around the rift before passing.', style: 'cautious' },
      { label: 'Toss all your gold coins into the anomaly to see if it responds.', style: 'unpredictable' },
    ],
    difficultyWeight: 2,
    dmReasoning: 'Floor 2 introduces environmental mechanics. The rift offers multiple resolution paths with different HP/gold outcomes.',
  },
  {
    encounterTitle: 'Floor 3: Core Chamber of the Golem',
    narrativeText: 'The ground shakes as heavy pillars of rune-inscribed volcanic stone assemble. An Obsidian Behemoth steps forth, roaring in low acoustic rumbles that vibrate in your throat. Its chest glows with a molten fire core.',
    enemyName: 'Obsidian Behemoth', enemyType: 'Colossus',
    availableActions: [
      { label: 'Unleash your class ultimate, direct assault on the core chest.', style: 'aggressive' },
      { label: 'Chant an ancient elemental pacification script with heavy focus.', style: 'diplomatic' },
      { label: 'Slide under its heavy swings, targeting its ankle joints.', style: 'cautious' },
      { label: 'Scream a battle cry and run around its legs to cause vertigo.', style: 'unpredictable' },
    ],
    difficultyWeight: 4,
    dmReasoning: 'Floor 3 boss. High difficultyWeight reflects escalating challenge. All approaches viable.',
  },
  {
    encounterTitle: 'Floor 5: The Axiom Core Sentinel',
    narrativeText: 'You stand at the bottom of the world. A massive, floating geometric construct — the Axiom Sentinel — unfolds. Rings spin rapidly as it charges an absolute disintegration laser. The essence of the entire Realm is locked inside.',
    enemyName: 'The Axiom Sentinel', enemyType: 'Entity',
    availableActions: [
      { label: 'Overdrive your gear for a high-risk, fatal piercing charge.', style: 'aggressive' },
      { label: 'Synchronize your life pulse with the machine core to unlock it.', style: 'diplomatic' },
      { label: 'Evade behind heavy pillars, timing strike sequences between lasers.', style: 'cautious' },
      { label: 'Redirect the laser energy back into its lens using a relic mirror!', style: 'unpredictable' },
    ],
    difficultyWeight: 5,
    dmReasoning: 'Final boss. Maximum difficulty. Player has full run history factored in.',
  },
];

// ─── Combat Outcomes ──────────────────────────────────────────────────────────
export const MOCK_COMBAT_OUTCOMES = [
  { outcomeText: 'Your furious strike breaks their optical shield. The Sentry triggers an emergency combustion blast, scorching your forearms but collapsing in a shower of steel parts!', playerHpDelta: -15, enemyHpDelta: -4, combatOver: false, playerWon: false, winQuality: 'clean' as const, rivalReasoning: 'Precision strike hit a structural weakness.' },
  { outcomeText: "Sneaking beneath its lens sweeps, you notice an uncovered power cable. You make a clean sever. The robot powers down silently without throwing an alarm alert!", playerHpDelta: 0, enemyHpDelta: -3, combatOver: false, playerWon: false, winQuality: 'clean' as const, rivalReasoning: 'Cautious approach rewarded — evasion succeeded.' },
  { outcomeText: 'Your taunt makes the guardian overextend. Its momentum carries it past you. You plant your blade in its spine.', playerHpDelta: 0, enemyHpDelta: -5, combatOver: false, playerWon: false, winQuality: 'clean' as const, rivalReasoning: 'Diplomatic approach succeeded perfectly.' },
  { outcomeText: 'The construct staggers. Its eye dims. With one final strike, the ancient guardian crumbles to dust and scattered metal.', playerHpDelta: -5, enemyHpDelta: -10, combatOver: true, playerWon: true, winQuality: 'clean' as const, rivalReasoning: 'Cumulative damage sufficient for victory.' },
];

// ─── Loot ─────────────────────────────────────────────────────────────────────
export const FLOOR_LOOT_ITEMS: GameItem[] = [
  { itemName: "Sentinel's Cracked Eye", itemEffect: '+2 to the first strike of each combat encounter', styleNote: 'Dropped by the Cobalt Sentry.', flavorText: 'Even shattered, it sees the gap in every guard.', itemType: 'ring' },
  { itemName: 'Temporal Feather',       itemEffect: '+10 Cunning, fades out of touch periodically.', styleNote: 'From the chrono-rift.', flavorText: 'Fades out of physical touch periodically when shaken.', itemType: 'relic' },
  { itemName: 'Axiom Potion',           itemEffect: '+50 HP instantly',                               styleNote: 'Post-boss reward.',   flavorText: 'A powerful celestial draft that mends damaged fibers.', itemType: 'consumable' },
];

export const MERCHANT_ITEMS: GameItem[] = [
  { itemName: 'Axiom Potion',      itemEffect: '+40 HP',             styleNote: '', flavorText: 'A effervescent liquid that smells like fresh rain and lightning.',   itemType: 'potion',  cost: 20 },
  { itemName: 'Dragonsteel Ring',  itemEffect: '+15 Atk',            styleNote: '', flavorText: 'Brimming with raw flame, it pulses with a heavy heat beat.',          itemType: 'relic',   cost: 40 },
  { itemName: 'Aether Shielding',  itemEffect: '+30 Shield',         styleNote: '', flavorText: 'An iridescent plate that absorbs energetic impact spikes.',           itemType: 'armor',   cost: 35 },
  { itemName: 'Chrono-Scythe',     itemEffect: '+25 Critical',       styleNote: '', flavorText: 'The curved edge slices fractions of seconds ahead.',                  itemType: 'weapon',  cost: 60 },
  { itemName: 'Cosmic Reliquary',  itemEffect: 'Immune Next Hit',    styleNote: '', flavorText: 'A puzzle box that vibrates gently with void energies.',               itemType: 'relic',   cost: 50 },
];

// ─── Player Profile ───────────────────────────────────────────────────────────
export const DEFAULT_PROFILE: PlayerProfile = {
  playerId: 'explorer_01', runsCompleted: 3, averageStyle: 'aggres',
  favoriteClass: 'blade_dancer', bestDepth: 4,
  allTimeTitles: ['The Iron Warlord', 'The Principled Dancer'],
};

export const PLAY_STYLE_TITLES: Record<string, string[]> = {
  aggressive:    ['Ruthless Warlord', 'The Iron Blade', 'Harbinger of Violence'],
  diplomatic:    ['Serene Harmonizer', 'The Velvet Negotiator', 'Peacemaker'],
  cautious:      ['Tactical Specter', 'Ghost of the Dungeon', 'The Patient'],
  unpredictable: ['Anarchic Chaos-Engine', 'The Enigma', 'Wild Variable'],
};

export const FLOOR_LABELS: Record<number, string> = {
  1: 'The Cobalt Gatehouse', 2: 'The Chrono-Fractured Cleft',
  3: 'Core Chamber of the Golem', 4: "The Outpost of Shady Al", 5: 'The Axiom Core',
};
