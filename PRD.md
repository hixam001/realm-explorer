# Product Requirements Document (PRD)
# Realm Explorer — Agentic Dungeon Crawler
### Google Antigravity Hackathon · Challenge 4: The Mobile App Alchemy

**Version:** 1.0  
**Status:** Pre-Build Planning  
**Target Platform:** Mobile (Android APK primary) + Web fallback  
**Tech Stack:** React Native (Expo) · Firebase Cloud Functions (JavaScript ONLY) · Firestore · Gemini API · Google Antigravity

---

## 1. Executive Summary

**Realm Explorer** is a procedurally generated, AI-powered dungeon-crawler RPG for mobile. Every floor, every enemy, every piece of loot, and every post-run story is created in real-time by a multi-agent AI system orchestrated through Google Antigravity. No two runs are ever identical. The player's own choices — how they fight, negotiate, or retreat — are continuously observed by the AI and used to sculpt an increasingly personalised challenge. This creates a classic roguelike "just-one-more-run" retention loop, powered entirely by agentic reasoning rather than static content libraries.

The game is purpose-built to satisfy **all mandatory and optional requirements of Challenge 4** of the Google Antigravity Hackathon, with Google Antigravity serving as the primary orchestration layer for all AI agent workflows throughout development and at runtime.

---

## 2. Game Overview

### 2.1 Premise

The player descends a 5-floor procedural dungeon. On each floor, the **Dungeon Master (DM) Agent** generates a unique encounter — a narrative scene, an enemy, and a set of contextual actions — based on the player's class, current health, and observed play style. After the player makes their choice, the **Rival Agent** resolves the combat or negotiation and calculates the outcome. Winning a floor may trigger the **Loot Agent**, which awards a contextually appropriate item. After Floor 5 (or upon death), the **Recap Agent** writes a personalised short story summarising the entire run and assigns the player a title. The player's profile persists across runs, unlocking new classes and shaping future DM behaviour.

### 2.2 The Core Retention Loop (Action → Feedback → Reward)

```
[Class Select]
      │
      ▼
[DM Agent: Generate Encounter] ← Player profile, floor number, play style
      │
      ▼
[EncounterScreen: Player Chooses Action]
      │
      ▼
[Rival Agent: Resolve Outcome] ← Player action, enemy type, combat turns
      │
      ├── Win → [Loot Agent: Generate Item] → [Next Floor]
      │
      └── Die → [Recap Agent: Write Story] → [Home Screen]
      
[Floor 5 cleared] → [Recap Agent: Write Story] → [Home Screen: Update Profile]
```

Every step in this loop passes through a Firebase Cloud Function (JavaScript) that calls the Gemini API. The full input/output of every agent call is written to Firestore and mirrored to `workflow_log.md` in the Antigravity workspace, satisfying the Agent Trace deliverable.

### 2.3 Dynamic Flow (Difficulty Adaptation)

The DM Agent receives the player's `playStyle` (derived live from `actionHistory`) and a `difficultyWeight` it sets itself. The following adaptation rules apply:

| Player State | DM Response |
|---|---|
| HP < 30% | DM reduces `difficultyWeight` by 1, offers more `negotiate` options |
| Aggressive play style | DM generates more `combat`-type enemies, higher stakes |
| Diplomatic play style | DM generates more `hybrid` enemies, dialogue-first encounters |
| Cautious play style | DM introduces trap and stealth encounters |
| Unpredictable style | DM randomises enemy types, highest narrative variety |

The Rival Agent also adapts: `combatTurns` is tracked across the run. If a player is consistently winning in one turn, the Rival Agent increases enemy resilience in later floors.

---

## 3. Actors & Use Cases

### 3.1 Human Actors

#### Actor 1: The Player
The primary user. Interacts with the mobile app to make gameplay decisions.

| Use Case | Description |
|---|---|
| UC-P1: Start New Run | Player selects a character class and begins a dungeon run. A new `RunState` is created in Firestore. |
| UC-P2: Make Encounter Choice | Player selects one of 3–5 AI-generated action options on the Encounter screen. |
| UC-P3: View DM Reasoning | Player can see the DM's `dmReasoning` field in a collapsed panel at the bottom of the Encounter screen — the live agent trace made visible. |
| UC-P4: Visit Merchant | On Floor 4, the player enters the Merchant screen powered by the Loot Agent to browse and purchase items. |
| UC-P5: Read Recap | After run ends, player reads the Recap Agent's personalised story and receives a title. |
| UC-P6: View Run History | Player can view past run recaps stored in their Firestore profile. |

### 3.2 AI Actors (Agents)

#### Agent 1: Dungeon Master (DM) Agent
**Orchestrated by:** Google Antigravity via `build-dm-agent` workflow  
**Runtime:** Firebase Cloud Function `dmAgent` (**JavaScript — .js only**)  
**Model:** Gemini 2.0 Flash

**Responsibilities:**
- Receives the full run context (class, HP, floor, play style, action history, event log).
- Analyses player behaviour to derive encounter difficulty.
- Generates a fully narrative encounter: title, story text, enemy name, enemy type, and 3–5 contextual action options.
- Produces `dmReasoning`: a plain-English explanation of its decision, exposed to the player as an in-game "agent trace."
- Persists the encounter to Firestore at `runs/{runId}/encounters/floor_{n}`.

**Use Cases:**
- UC-DM1: Generate Floor Encounter (called on every floor load).
- UC-DM2: Adapt Difficulty (inferred from player stats in the prompt).
- UC-DM3: Generate Merchant Inventory (Floor 4 special call).
- UC-DM4: Write fallback encounter on Gemini API failure (hardcoded safe default).

**Input Schema:**
```json
{
  "runId": "string",
  "playerId": "string",
  "floorNumber": "1-5",
  "playerClass": "blade_dancer | ember_mage | shadow_rogue",
  "hp": "number",
  "playStyle": "aggressive | diplomatic | cautious | unpredictable",
  "actionHistory": ["string"],
  "eventLog": ["string"]
}
```

**Output Schema:**
```json
{
  "encounterTitle": "string",
  "narrativeText": "string",
  "enemyName": "string",
  "enemyType": "combat | negotiation | hybrid",
  "availableActions": ["string"],
  "difficultyWeight": "1-5",
  "dmReasoning": "string"
}
```

---

#### Agent 2: Rival Agent
**Orchestrated by:** Google Antigravity via `build-rival-agent` workflow  
**Runtime:** Firebase Cloud Function `rivalAgent` (**JavaScript — .js only**)  
**Model:** Gemini 2.0 Flash

**Responsibilities:**
- Receives the player's chosen action, the enemy's stats, and the current combat context.
- Acts as the "AI opponent" — decides what the enemy does in response.
- Calculates HP delta for both player and enemy.
- Returns a narrative outcome, the HP changes, and whether the encounter was won.
- Tracks `combatTurns` to escalate difficulty in prolonged fights.

**Use Cases:**
- UC-RV1: Resolve Player Action (called after every player choice).
- UC-RV2: Escalate Enemy Behaviour (if `combatTurns` > 3, enemy uses special moves).
- UC-RV3: Determine Win Quality (`clean`, `close`, or `messy`) to pass to Loot Agent.

**Input Schema:**
```json
{
  "runId": "string",
  "enemyName": "string",
  "enemyType": "combat | negotiation | hybrid",
  "enemyHp": "number",
  "playerAction": "string",
  "playerHp": "number",
  "playerClass": "string",
  "combatTurns": "number"
}
```

**Output Schema:**
```json
{
  "outcomeText": "string",
  "playerHpDelta": "number",
  "enemyHpDelta": "number",
  "combatOver": "true | false",
  "playerWon": "true | false",
  "winQuality": "clean | close | messy",
  "rivalReasoning": "string"
}
```

---

#### Agent 3: Loot Agent
**Orchestrated by:** Google Antigravity via `build-loot-agent` workflow  
**Runtime:** Firebase Cloud Function `lootAgent` (**JavaScript — .js only**)  
**Model:** Gemini 2.0 Flash

**Responsibilities:**
- Called after a floor is won to generate a contextually relevant item reward.
- Receives the player's class, play style, floor number, and `winQuality` to craft an item that genuinely reflects the run so far.
- Avoids generic loot — items must include `styleNote` (why this item suits this player) and `flavorText`.

**Use Cases:**
- UC-LT1: Generate Floor Reward (post-combat win).
- UC-LT2: Generate Merchant Inventory (3 items for the Floor 4 shop).
- UC-LT3: Balance reward power by `winQuality` (messy wins get weaker items).

**Input Schema:**
```json
{
  "runId": "string",
  "playerId": "string",
  "playerClass": "string",
  "playStyle": "string",
  "floorNumber": "number",
  "winQuality": "clean | close | messy",
  "eventLog": ["string"]
}
```

**Output Schema:**
```json
{
  "itemName": "string",
  "itemEffect": "string",
  "styleNote": "string",
  "flavorText": "string",
  "itemType": "weapon | armor | ring | consumable"
}
```

---

#### Agent 4: Recap Agent
**Orchestrated by:** Google Antigravity via `build-recap-agent` workflow  
**Runtime:** Firebase Cloud Function `recapAgent` (**JavaScript — .js only**)  
**Model:** Gemini 2.0 Flash

**Responsibilities:**
- Called at the very end of every run (win or death).
- Reads the full event log and generates a personalised short story (3–5 sentences) about the run.
- Assigns a unique title to the player for that run (e.g. "The Merciful Blade Dancer").
- Updates the player profile in Firestore with the new title and run statistics.

**Use Cases:**
- UC-RC1: Generate Run Narrative.
- UC-RC2: Assign Run Title.
- UC-RC3: Update Player Profile (best depth, favourite class, all-time titles).

**Input Schema:**
```json
{
  "runId": "string",
  "playerId": "string",
  "playerClass": "string",
  "finalHp": "number",
  "floorsCompleted": "0-5",
  "died": "true | false",
  "gold": "number",
  "playStyle": "string",
  "eventLog": ["string"],
  "inventory": ["itemName"]
}
```

**Output Schema:**
```json
{
  "narrativeText": "string",
  "runTitle": "string"
}
```

---

#### Agent 5: Fairness Referee (Embedded Logic)
**Type:** Rule-based validation layer inside `rivalAgent` Cloud Function (not a separate Gemini call)

**Responsibilities:**
- Validates that the Rival Agent's HP deltas are within acceptable bounds (no one-shot kills on Floor 1).
- Ensures `winQuality` is calculated consistently.
- Prevents infinite loops (if `combatTurns` > 6, forces run resolution).
- Acts as the "AI referee" required by Challenge 4's Validation & Fair Play criterion.

---

### 3.3 System Actors

| Actor | Role |
|---|---|
| Firebase Cloud Functions (JS) | Hosts all agent logic server-side. Receives HTTP POST requests from the app. **All functions are .js files — no TypeScript in the functions directory.** |
| Firestore | Persists all game state, player profiles, encounter history, and recap stories. |
| Gemini 2.0 Flash | The language model powering all four primary agents. |
| Google Antigravity | Orchestrates the build workflow; its `.agent/workflow_log.md` serves as the Agent Trace deliverable. |
| Expo EAS Build | Generates the Android APK for judge distribution. |
| Firebase App Distribution | Delivers the APK to judges via email link. |
| Firebase Hosting | Serves the web fallback version. |

---

## 4. Screens & Navigation Flow

```
HomeScreen
    │
    ├── [No saved profile] → Create profile → ClassSelectScreen
    └── [Saved profile] → ClassSelectScreen
            │
            ▼
    ClassSelectScreen (pick Blade Dancer / Ember Mage / Shadow Rogue)
            │
            ▼
    EncounterScreen (Floors 1–3, 5)
            │
            ├── [Floor 4] → MerchantScreen → EncounterScreen (Floor 5)
            └── [Player dies] → RecapScreen
            │
            ▼
    RecapScreen → HomeScreen
```

### Screen Specifications

| Screen | Key Components | Agent Calls |
|---|---|---|
| HomeScreen | Player profile card, run history list, "Start Run" button | None (Firestore read only) |
| ClassSelectScreen | 3 class cards with stats, animated selection | None |
| EncounterScreen | StatBar, DmThinkingPanel, narrative text, enemy box, action buttons, DM reasoning panel | `dmAgent`, `rivalAgent` |
| MerchantScreen | 3 item cards (from Loot Agent), gold display, buy/skip buttons | `lootAgent` |
| RecapScreen | Animated story text, run title badge, stats summary, "Play Again" button | `recapAgent` |
| DmThinkingPanel | Pulsing dot, "DM is thinking..." message, real-time status text | (overlay, no direct call) |

---

## 5. Data Architecture

### 5.1 Firestore Collections

```
players/
  {playerId}/
    - runsCompleted: number
    - averageStyle: string
    - favoriteClass: string
    - bestDepth: number
    - allTimeTitles: string[]
    - unlockedClasses: string[]
    recaps/
      {runId}/
        - narrativeText: string
        - runTitle: string
        - timestamp: Timestamp

runs/
  {runId}/
    - playerId: string
    - playerClass: string
    - hp: number
    - maxHp: number
    - gold: number
    - currentFloor: number
    - playStyle: string
    - actionHistory: string[]
    - eventLog: string[]
    - inventory: GameItem[]
    - status: "active" | "completed" | "died"
    - startedAt: Timestamp
    encounters/
      floor_1/ ... floor_5/
        - encounterTitle: string
        - narrativeText: string
        - enemyName: string
        - enemyType: string
        - availableActions: string[]
        - difficultyWeight: number
        - dmReasoning: string
        - playerChoice: string
        - outcome: "success" | "partial" | "failure"
        - hpAfter: number
        - timestamp: Timestamp
```

### 5.2 Global State (Zustand — `gameStore.ts`)

| State Key | Type | Purpose |
|---|---|---|
| `run` | `RunState \| null` | The active run data |
| `currentEncounter` | `Encounter \| null` | The current floor's generated encounter |
| `isThinking` | `boolean` | Controls DmThinkingPanel visibility |
| `thinkingMessage` | `string` | Real-time status text shown during agent calls |
| `profile` | `PlayerProfile \| null` | Persisted player profile from Firestore |

---

## 6. Hackathon Compliance Matrix (Challenge 4)

The following table maps every Challenge 4 requirement to a specific feature in Realm Explorer.

### 6.1 Evaluation Criteria Checklist

| Criterion | Weight | Realm Explorer Implementation | Status |
|---|---|---|---|
| **Antigravity Execution** | 30% | Antigravity orchestrates all 4 agent Cloud Functions via named `.agent/workflows/` files. `workflow_log.md` records every reasoning step, tool call, and agent output during build. Agent architecture map submitted as deliverable. | ✅ Fully covered |
| **Gameplay Engagement** | 25% | Core loop: Choose class → DM generates encounter → Make choice → Rival resolves → Loot rewards → Recap tells your story. Difficulty adapts to play style. New content on every run. Run history creates meta-progression. | ✅ Fully covered |
| **Agentic Innovation** | 20% | AI opponents (Rival Agent) learn from `combatTurns` and escalate. DM adapts narrative style to detected play style. Loot Agent reads `winQuality` to generate meaningful, not random, rewards. Recap Agent produces unique stories. | ✅ Fully covered |
| **Technical Polish** | 15% | Dark theme UI (`#1A1A2E` background, `#1D9E75` accent). Animated DmThinkingPanel with pulsing dot. StatBar with colour-coded HP. Graceful error handling with fallback encounters on all Cloud Functions. | ✅ Fully covered |
| **Concept & Originality** | 10% | DM Reasoning panel exposes live AI thinking to the player — the agent trace becomes a game mechanic. Play style is emergent (not chosen by the player; inferred from behaviour). Recap creates a unique short story about YOUR specific run. | ✅ Fully covered |

### 6.2 Mandatory Requirements Checklist

| Requirement | Realm Explorer Implementation | Status |
|---|---|---|
| **Dynamic Flow** | DM Agent adapts encounter type, difficulty, and available actions based on live `playStyle` and HP. No hardcoded encounter sequences. | ✅ Met |
| **Intelligent Mechanics** | Four distinct AI agents operate with specialised roles. Rival Agent is a "living" opponent, not a script. Loot Agent reasons about the player's run. | ✅ Met |
| **High Retention Loop** | Action (player choice) → Feedback (Rival resolves, DM narrates) → Reward (Loot Agent item + Recap title). Fast, satisfying cycle on mobile. | ✅ Met |
| **Agentic Workflow (MANDATORY)** | Antigravity workflows defined in `.agent/workflows/` for every agent. Planning → Decision → Execution → Follow-up traceable in `workflow_log.md`. | ✅ Met |
| **Visual Feedback & State** | DmThinkingPanel shown during all agent calls. StatBar updates in real-time. Encounter content fully replaces between floors. | ✅ Met |
| **Validation & Fair Play** | Fairness Referee embedded in `rivalAgent`: bounds-checks HP deltas, caps combat turns, enforces consistent `winQuality` logic. | ✅ Met |
| **Agent Trace / Logs Deliverable** | `workflow_log.md` maintained by Antigravity throughout build. `dmReasoning` field visible in-app. All encounters persisted to Firestore. Firestore data exported for submission. | ✅ Met |
| **Working Prototype: Mobile App (MUST)** | Android APK built via Expo EAS Build, distributed via Firebase App Distribution. | ✅ Met |
| **Demo Video (3 min)** | Screen-recorded Expo Go session showing: class select → encounter → DM reasoning panel → loot → recap story. | ✅ Met |
| **Architecture Map** | This PRD + the Antigravity workflow files constitute the architecture map. | ✅ Met |
| **README** | Documented in the repo with Antigravity usage explanation and Firestore schema. | ✅ Met |

---

## 7. Non-Functional Requirements

| Requirement | Specification |
|---|---|
| **Response Time** | Agent Cloud Functions must respond within 8 seconds. DmThinkingPanel must be shown for any wait > 500ms. |
| **Fallback Handling** | Every Cloud Function must return a hardcoded fallback response on any error. The app must never show a blank screen. |
| **Offline Resilience** | If no connection is detected, show the last Firestore-cached encounter and a "Reconnecting..." banner. |
| **Platform Support** | Primary: Android APK. Secondary: iOS via Expo Go. Tertiary: Web via Firebase Hosting. |
| **API Key Security** | Gemini API key stored in Firebase Functions environment config (`functions:config:set`). Never committed to the repo or embedded in the app bundle. |
| **Logging** | All Cloud Function invocations logged to Firebase Functions console. All Firestore writes include a `timestamp` field. |
| **Agent Trace Requirement** | `workflow_log.md` in the `.agent/` folder must be updated after every workflow execution. This is a strict hackathon deliverable rule. |

---

## 8. Character Classes

| Class | Description | Play Style Affinity | Starting HP |
|---|---|---|---|
| **Blade Dancer** | A swift melee fighter who excels in rapid combos. | Aggressive | 10 |
| **Ember Mage** | A tactical spellcaster who prefers high-risk, high-reward plays. | Unpredictable | 8 |
| **Shadow Rogue** | A careful infiltrator who uses deception and escape routes. | Cautious | 9 |

---

## 9. Build Priority Order (3-Day Hackathon Plan)

### Day 1 — Backend Agents (JavaScript Only)
1. Firebase project setup (Firestore, Functions, Hosting)
2. Antigravity workspace setup with `rules.md`, `GEMINI.md`, and all workflow files in `.agent/`
3. `dmAgent` Cloud Function (.js) — build, deploy, test with `curl`
4. `rivalAgent` Cloud Function (.js) — build, deploy, test
5. `lootAgent` Cloud Function (.js) — build, deploy, test
6. `recapAgent` Cloud Function (.js) — build, deploy, test

### Day 2 — React Native Frontend (TypeScript)
7. Expo project scaffold with all dependencies
8. Zustand store setup (`gameStore.ts`)
9. Firebase client config (`firebase.ts`)
10. API service layer (`api.ts`)
11. All screens built via Antigravity `build-rn-screen` workflow
12. Full navigation wired up in `App.tsx`
13. Full run tested end-to-end on Android emulator

### Day 3 — Polish, Deploy, Submit
14. DmThinkingPanel on all screens
15. Error handling and fallback UI on all screens
16. Web build → Firebase Hosting deploy
17. EAS Build APK (start early, takes ~10 min)
18. Firebase App Distribution upload
19. Record 3-minute demo video
20. Export `workflow_log.md` and Firestore data for submission

---

## 10. Agent Trace Logging Rule (Mandatory)

> **This rule is non-negotiable for hackathon compliance.**

Google Antigravity MUST maintain a file at `.agent/workflow_log.md` in the workspace. After every workflow execution — including agent builds, tool calls, file edits, and reasoning steps — Antigravity must append a structured log entry to this file. The file is a running diary of all agentic activity during the build and is submitted as the required "Agent Trace / Logs" deliverable.

Each log entry must follow this format:

```markdown
## [Timestamp] — Workflow: [workflow-name]

**Trigger:** [what initiated this workflow]
**Agent:** [which agent or function was built/modified]
**Reasoning:** [why this approach was taken]
**Actions Taken:**
- [file created/edited]
- [tool called]
- [function deployed]
**Output:** [result or outcome]
**Status:** ✅ Success / ❌ Failed / ⚠️ Partial
```
