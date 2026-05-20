/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CharacterClass, DungeonEncounter, LootItem, PlayStyleType } from '../types';

export const CHARACTER_CLASSES: CharacterClass[] = [
  {
    id: 'blade_dancer',
    name: 'Blade Dancer',
    hp: 100,
    maxHp: 100,
    gold: 50,
    ability: 'Vortex Tempest',
    abilityDesc: 'Dash through enemies in a blur of steal, rolling a high-chance dodge or heavy landing strike.',
    accentColor: 'cyan',
    stats: {
      strength: 8,
      intelligence: 4,
      stealth: 6,
    },
    startingInventory: ['Tempered Steel Falchion', 'Worn Leather Gauntlets'],
  },
  {
    id: 'ember_mage',
    name: 'Ember Mage',
    hp: 80,
    maxHp: 80,
    gold: 80,
    ability: 'Supernova Burst',
    abilityDesc: 'Unleash a devastating burst of cosmic fire, incinerating obstacles but draining 10 HP on backfire.',
    accentColor: 'rose',
    stats: {
      strength: 3,
      intelligence: 10,
      stealth: 4,
    },
    startingInventory: ['Ember Shard Focal-Staff', 'Parchment Spell Scroll'],
  },
  {
    id: 'shadow_rogue',
    name: 'Shadow Rogue',
    hp: 90,
    maxHp: 90,
    gold: 60,
    ability: 'Cloak of Silence',
    abilityDesc: 'Disappear into absolute shadow, guaranteeing the next strike ignores defense and lands critical.',
    accentColor: 'amber',
    stats: {
      strength: 5,
      intelligence: 5,
      stealth: 10,
    },
    startingInventory: ['Viper-Venom Stilettos', 'Grappling Utility Anchor'],
  },
];

export const CAMPAIGN_ENCOUNTERS: Record<number, DungeonEncounter> = {
  1: {
    floorNumber: 1,
    floorType: 'combat',
    title: 'Floor 1: The Cobalt Gatehouse',
    narrative: 'A heavy mechanical gateway hums with ancient energy. Before it stands a Cobalt Sentry, its single eye scanning the hallway for intruders. Steam vents from its iron joints. There is no going back; only through.',
    enemy: {
      name: 'Cobalt Sentry',
      type: 'Automaton',
      hp: 60,
      maxHp: 60,
      baseDamage: 12,
    },
    choices: [
      { id: 'f1_agg', text: 'Draw weapon and lunge directly at the machine\'s eye sensor.', style: 'aggressive' },
      { id: 'f1_dip', text: 'Show the standard faction mark and speak the bypass code.', style: 'diplomatic' },
      { id: 'f1_cau', text: 'Observe its rotational sweep, timing your crawl beneath its sensor blindspot.', style: 'cautious' },
      { id: 'f1_unp', text: 'Throw a loose metal gear directly into its coolant exhaust pipe.', style: 'unpredictable' },
    ],
    illustrationSeed: 'sentry',
  },
  2: {
    floorNumber: 2,
    floorType: 'rift',
    title: 'Floor 2: The Chrono-Fractured Cleft',
    narrative: 'A strange crack in space-time hovers in the air, glowing with brilliant amethyst ripples. Shards of ancient cobblestone float suspended around it. You feel your weapons vibrate. A spatial rift stands in your absolute path.',
    choices: [
      { id: 'f2_agg', text: 'Shatter the rift core with a concentrated energy strike.', style: 'aggressive' },
      { id: 'f2_dip', text: 'Attune yourself to the temporal frequency and step through.', style: 'diplomatic' },
      { id: 'f2_cau', text: 'Carefully rig a grounding wire around the rift before passing.', style: 'cautious' },
      { id: 'f2_unp', text: 'Toss all your gold coins into the anomaly to see if it responds.', style: 'unpredictable' },
    ],
    illustrationSeed: 'fracture',
  },
  3: {
    floorNumber: 3,
    floorType: 'boss',
    title: 'Floor 3: Core Chamber of the Golem',
    narrative: 'The ground shakes as heavy pillars of rune-inscribed volcanic stone assemble. An Obsidian Behemoth steps forth, roaring in low acoustic rumbles that vibrate in your throat. Its chest glows with a molten fire core.',
    enemy: {
      name: 'Obsidian Behemoth',
      type: 'Colossus',
      hp: 120,
      maxHp: 120,
      baseDamage: 22,
    },
    choices: [
      { id: 'f3_agg', text: 'Unleash your class ultimate, direct assault on the core chest.', style: 'aggressive' },
      { id: 'f3_dip', text: 'Chant an ancient elemental pacification script with heavy focus.', style: 'diplomatic' },
      { id: 'f3_cau', text: 'Slide under its heavy swings, targeting its ankle joints.', style: 'cautious' },
      { id: 'f3_unp', text: 'Scream a battle cry and run around its legs to cause vertigo.', style: 'unpredictable' },
    ],
    illustrationSeed: 'behemoth',
  },
  4: {
    floorNumber: 4,
    floorType: 'merchant',
    title: 'Floor 4: The Outpost of Shady Al',
    narrative: 'A neon-lit merchant stand has been oddly pitched inside a hollowed giant pillar. A multi-armed merchant with glowing goggles grins smoothly: "Ah, raw potential enters my lobby. Got coordinates, items, steel. Have a browse!"',
    choices: [],
    illustrationSeed: 'merchant',
  },
  5: {
    floorNumber: 5,
    floorType: 'boss',
    title: 'Floor 5: The Axiom Core Sentinel',
    narrative: 'You stand at the bottom of the world. A massive, floating geometric construct—the Axiom Sentinel—unfolds. Rings spin rapidly as it charges an absolute disintegration laser. The essence of the entire Realm is locked inside.',
    enemy: {
      name: 'The Axiom Sentinel',
      type: 'Entity',
      hp: 180,
      maxHp: 180,
      baseDamage: 30,
    },
    choices: [
      { id: 'f5_agg', text: 'Overdrive your gear for a high-risk, fatal piercing charge.', style: 'aggressive' },
      { id: 'f5_dip', text: 'Synchronize your life pulse with the machine core to unlock it.', style: 'diplomatic' },
      { id: 'f5_cau', text: 'Evade behind heavy pillars, timing strike sequences between lasers.', style: 'cautious' },
      { id: 'f5_unp', text: 'Redirect the laser energy back into its lens using a relic mirror!', style: 'unpredictable' },
    ],
    illustrationSeed: 'core',
  },
};

export const MERCHANT_ITEMS_POOL: LootItem[] = [
  { id: 'm_ap', name: 'Axiom Potion', type: 'potion', modifier: '+40 HP', flavorText: 'A effervescent liquid that smells like fresh rain and lightning.', price: 20 },
  { id: 'm_dr', name: 'Dragonsteel Ring', type: 'relic', modifier: '+15 Atk', flavorText: 'Brimming with raw flame, it pulses with a heavy heat beat.', price: 40 },
  { id: 'm_as', name: 'Aether Shielding', type: 'armor', modifier: '+30 Shield', flavorText: 'An iridescent plate that absorbs energetic impact spikes.', price: 35 },
  { id: 'm_cs', name: 'Chrono-Scythe', type: 'weapon', modifier: '+25 Critical', flavorText: 'The curved edge slices fractions of seconds ahead.', price: 60 },
  { id: 'm_cr', name: 'Cosmic Reliquary', type: 'relic', modifier: 'Immune Next Hit', flavorText: 'A puzzle box that vibrates gently with void energies.', price: 50 },
];

export const LOOT_POOL: LootItem[] = [
  { id: 'l_sb', name: 'Sentry Core Blade', type: 'weapon', modifier: '+12 Atk', flavorText: 'Forged from the coolant tubes of a fallen cobalt protector.' },
  { id: 'l_tf', name: 'Temporal Feather', type: 'relic', modifier: '+10 Cunning', flavorText: 'Fades out of physical touch periodically when shaken.' },
  { id: 'l_ap', name: 'Axiom Potion', type: 'potion', modifier: '+50 HP', flavorText: 'A powerful celestial draft that mends damaged fibers instantly.' },
  { id: 'l_rc', name: 'Rift-Walker Cape', type: 'armor', modifier: '+10 Agility', flavorText: 'Drags a tiny trailing purple rift shadow behind!' },
];

export function getStoryOutcome(
  floorNumber: number,
  choiceStyle: PlayStyleType,
  characterClassId: string
): {
  narrativeOutcome: string;
  playerHpChange: number;
  enemyHpChange: number;
  xpAward?: number;
  goldAward: number;
  combatStatus: 'fighting' | 'player_won' | 'player_escaped' | 'player_died';
} {
  const resultBase = {
    playerHpChange: 0,
    enemyHpChange: -30,
    goldAward: 0,
    combatStatus: 'player_won' as const,
  };

  if (floorNumber === 1) {
    switch (choiceStyle) {
      case 'aggressive':
        return {
          narrativeOutcome: 'Your furious strike breaks their optical shield. The Sentry triggers an emergency combustion blast, scorching your forearms but collapsing in a shower of steel parts!',
          playerHpChange: -15,
          enemyHpChange: -60,
          goldAward: 15,
          combatStatus: 'player_won',
        };
      case 'diplomatic':
        return {
          narrativeOutcome: 'The bypass code validates! The Sentry clicks twice, stands to attention, and folds its blades away. It drops an ammunition storage cell before locking itself to standby.',
          playerHpChange: 0,
          enemyHpChange: -60, // bypasses combat
          goldAward: 25,
          combatStatus: 'player_won',
        };
      case 'cautious':
        return {
          narrativeOutcome: 'Sneaking beneath its lens sweeps, you notice an uncovered power cable. You make a clean sever. The robot powers down silently without throwing an alarm alert!',
          playerHpChange: 0,
          enemyHpChange: -60,
          goldAward: 20,
          combatStatus: 'player_won',
        };
      case 'unpredictable':
        return {
          narrativeOutcome: 'The jammed gear triggers an intense thermal cycle inside the Sentry. It spin circles in blind confusion, shooting laser flares everywhere. A stray blast singes your leg before it explodes violently!',
          playerHpChange: -25,
          enemyHpChange: -60,
          goldAward: 40,
          combatStatus: 'player_won',
        };
    }
  }

  if (floorNumber === 2) {
    switch (choiceStyle) {
      case 'aggressive':
        return {
          narrativeOutcome: 'You crash your blade into the spatial focal core! It shatters with a high-pitched acoustic glass sound, scattering rift crystals. The backlash drains your thermal layer but leaves the way open.',
          playerHpChange: -10,
          enemyHpChange: 0,
          goldAward: 30,
          combatStatus: 'player_won',
        };
      case 'diplomatic':
        return {
          narrativeOutcome: 'Sinking peaceful thoughts into the temporal current, you find alignment. The rift envelops you gently, restoring your mental exhaustion, and safely repositions you on the other side.',
          playerHpChange: 15,
          enemyHpChange: 0,
          goldAward: 10,
          combatStatus: 'player_won',
        };
      case 'cautious':
        return {
          narrativeOutcome: 'Utilizing detailed grounding cables, you route the spatial discharge safely. With methodical caution, you step over the crack without losing a drop of health or asset energy.',
          playerHpChange: 0,
          enemyHpChange: 0,
          goldAward: 15,
          combatStatus: 'player_won',
        };
      case 'unpredictable':
        return {
          narrativeOutcome: 'You toss silver coins inside. The rift spins rapid feedback loops and spits them back out in superheated gold nuggets, together with a wave of raw temporal heat! High risk, high yield!',
          playerHpChange: -15,
          enemyHpChange: 0,
          goldAward: 65,
          combatStatus: 'player_won',
        };
    }
  }

  if (floorNumber === 3) {
    switch (choiceStyle) {
      case 'aggressive':
        return {
          narrativeOutcome: 'An explosive charge hits directly in the Obsidian Behemoth\'s chest core! The massive rock titan collapses into giant volcanic stones, causing a heavy local earthquake that scatters sharp shrapnel.',
          playerHpChange: -20,
          enemyHpChange: -120,
          goldAward: 40,
          combatStatus: 'player_won',
        };
      case 'diplomatic':
        return {
          narrativeOutcome: 'Your harmonic chanting resonates with the rune-rock inscriptions. The Obsidian Behemoth bends its knee, glowing soft green, and presents an ancient gold chest before decomposing into inert slate pillars.',
          playerHpChange: 0,
          enemyHpChange: -120,
          goldAward: 50,
          combatStatus: 'player_won',
        };
      case 'cautious':
        return {
          narrativeOutcome: 'Slipping beneath its massive fists, you strike its weak, dusty structural knee joints with deep focus. It crashes down forward, and you execute a clean core-lance without taking any counterattack.',
          playerHpChange: 0,
          enemyHpChange: -120,
          goldAward: 30,
          combatStatus: 'player_won',
        };
      case 'unpredictable':
        return {
          narrativeOutcome: 'Your screaming tactical maneuver totally baffles the Behemoth. It swings at nothing, smashing its own lava core, and explodes spectacularly! You pick up burning embers and molten gold, though you got a bit burnt.',
          playerHpChange: -15,
          enemyHpChange: -120,
          goldAward: 75,
          combatStatus: 'player_won',
        };
    }
  }

  if (floorNumber === 5) {
    switch (choiceStyle) {
      case 'aggressive':
        return {
          narrativeOutcome: 'Applying maximum overdrive, you execute a peerless fatal charge directly into the Axiom core. The ring assembly splinters. An immense blast of pure geometric white light sweeps across the room, carrying you to victory!',
          playerHpChange: -25,
          enemyHpChange: -180,
          goldAward: 100,
          combatStatus: 'player_won',
        };
      case 'diplomatic':
        return {
          narrativeOutcome: 'Your thoughts fuse seamlessly with the core\'s harmonic stream. The rings decelerate. The laser dims into solid starlight as the Core floats down and unlocks itself, recognizing your serene soul.',
          playerHpChange: 0,
          enemyHpChange: -180,
          goldAward: 80,
          combatStatus: 'player_won',
        };
      case 'cautious':
        return {
          narrativeOutcome: 'Dancing behind floating basalt panels, you count down the recharge loops perfectly. Timing the visual trigger, you fire your grappling hooks and tear the power lines. The Sentinel shuts down.',
          playerHpChange: -5,
          enemyHpChange: -180,
          goldAward: 70,
          combatStatus: 'player_won',
        };
      case 'unpredictable':
        return {
          narrativeOutcome: 'Using a shiny shard of the rift core from Floor 2, you prismatically redirect the laser beam straight back into the Sentinel\'s optical gate. The emitter melts, blowing the construct to atomic ash!',
          playerHpChange: -12,
          enemyHpChange: -180,
          goldAward: 120,
          combatStatus: 'player_won',
        };
    }
  }

  return {
    narrativeOutcome: 'You proceed quietly down the dungeon hallways.',
    playerHpChange: 0,
    enemyHpChange: -10,
    goldAward: 5,
    combatStatus: 'player_won',
  };
}

export function evaluatePlayStyleLabel(history: PlayStyleType[]): {
  style: PlayStyleType;
  title: string;
  longDesc: string;
} {
  const counts = { aggressive: 0, diplomatic: 0, cautious: 0, unpredictable: 0 };
  history.forEach(s => counts[s]++);

  let dominant: PlayStyleType = 'cautious';
  let max = -1;
  for (const k of Object.keys(counts) as PlayStyleType[]) {
    if (counts[k] > max) {
      max = counts[k];
      dominant = k;
    }
  }

  switch (dominant) {
    case 'aggressive':
      return {
        style: 'aggressive',
        title: 'Ruthless Warlord',
        longDesc: 'Your approach is characterized by absolute force. You resolve puzzles, rifts, and automatons alike through raw aggressive energy, shattering barrier plates first and asking questions never. A formidable, physical force.',
      };
    case 'diplomatic':
      return {
        style: 'diplomatic',
        title: 'Serene Harmonizer',
        longDesc: 'You prioritize synchronization and deep alignment over physical conflict. You decoded ancient bypass keys, calmed volcanics with elemental chanting, and bypassed major battles showing real tabletop tactician wisdom.',
      };
    case 'cautious':
      return {
        style: 'cautious',
        title: 'Tactical Specter',
        longDesc: 'You choose control and meticulous structural timing. Sliding under swings, observing scanning sweep loops, and rigging insulation cables—your careful movements saved your skin and preserved critical health thresholds.',
      };
    case 'unpredictable':
      return {
        style: 'unpredictable',
        title: 'Anarchic Chaos-Engine',
        longDesc: 'Absolutely erratic. Throwing debris into vents, tossing raw items into space-time tears, and blinding guardians with prism-reflections. Your actions baffle both the DM and rivals alike, yielding chaotic, high-reward fortunes.',
      };
  }
}
