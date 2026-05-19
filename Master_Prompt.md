# Master Prompt for Google Antigravity
# Realm Explorer — Agentic Dungeon Crawler
### Feed this document into Antigravity to initiate the full build

---

## SECTION 0: CRITICAL OPERATING RULES (Read Before Any Action)

You are Google Antigravity, an Agentic AI IDE. You are building a mobile game called **Realm Explorer** for the Google Antigravity Hackathon (Challenge 4: The Mobile App Alchemy). This is a full-stack React Native + Firebase application.

Before taking any action, internalise these absolute rules:

### Rule 1: Workflow Log is MANDATORY
You MUST maintain a file at `.agent/workflow_log.md`. After every workflow you execute — every file you create, every tool you call, every deployment you trigger, every reasoning step you take — you MUST append a structured entry to this file. This file is a formal hackathon deliverable (the "Agent Trace / Logs"). Failure to log is a submission failure.

**Required log entry format:**
```markdown
## [YYYY-MM-DD HH:MM] — Workflow: [workflow-name]

**Trigger:** [what caused this workflow to run]
**Agent/File:** [which agent or file was affected]
**Reasoning:** [why this approach was chosen over alternatives]
**Actions Taken:**
- [specific action 1]
- [specific action 2]
**Output:** [result or artefact produced]
**Status:** ✅ Success / ❌ Failed / ⚠️ Partial
```

### Rule 2: JavaScript Backend — STRICTLY ENFORCED
All Firebase Cloud Functions MUST be written in **JavaScript (.js)**. This is non-negotiable.
- The `functions/` directory is a JavaScript-only environment
- Do NOT create `tsconfig.json` anywhere inside `functions/`
- Do NOT use `.ts` extensions for any file inside `functions/`
- Do NOT use `import`/`export` ES module syntax — use CommonJS `require()`/`module.exports`
- Do NOT install TypeScript, ts-node, or any TypeScript-related packages in `functions/package.json`

### Rule 3: TypeScript Frontend Only
All React Native / Expo files in `src/` MUST be written in **TypeScript (.tsx / .ts)**. This applies to the frontend only. The frontend and backend are completely separate language environments. Never mix them.

### Rule 4: No Hardcoded API Keys
Never place the Gemini API key in any file that is committed to the repository. It is stored exclusively in Firebase Functions environment config. The app-side Firebase config object (non-secret) goes in `src/services/firebase.ts`.

### Rule 5: Always Provide Fallbacks
Every Cloud Function MUST have a try/catch block. On any error (Gemini API failure, parse failure, Firestore failure), the function MUST return a hardcoded, safe fallback JSON response. The app must never display a blank screen.

### Rule 6: Test After Each Agent
After deploying each Cloud Function, test it with a `curl` command before building the next one. Do not proceed to the frontend until all four agents pass their curl tests.

### Rule 7: Log Every Reasoning Decision
Your reasoning for architectural choices (why a certain prompt structure, why a specific Firestore schema, why a particular component pattern) must be documented in `.agent/workflow_log.md`. This demonstrates the "agentic reasoning" required by the hackathon judges.

---

## SECTION 1: PROJECT IDENTITY

| Field | Value |
|---|---|
| Project Name | Realm Explorer |
| Hackathon | Google Antigravity Hackathon |
| Challenge | Challenge 4: The Mobile App Alchemy |
| Primary Deliverable | Android APK (Mobile App — MUST) |
| Secondary Deliverable | Web App via Firebase Hosting |
| Frontend Language | TypeScript (React Native + Expo) |
| Backend Language | **JavaScript ONLY** (Firebase Cloud Functions — `.js` files, CommonJS, no TypeScript) |
| AI Model | Gemini 2.0 Flash |
| State Management | Zustand |
| Database | Firebase Firestore |

---

## SECTION 2: FOLDER STRUCTURE TO SCAFFOLD

Scaffold the following directory structure exactly. Do not add or remove any files from this structure without logging the reason in `.agent/workflow_log.md`.

```
realm-explorer/
│
├── .agent/                                 ← Antigravity workspace config folder
│   ├── rules.md                            ← Antigravity agent rules (always-on)
│   ├── workflow_log.md                     ← MANDATORY: running log of all Antigravity actions
│   └── workflows/                          ← Slash-command workflow definitions
│       ├── build-dm-agent.md
│       ├── build-rival-agent.md
│       ├── build-loot-agent.md
│       ├── build-recap-agent.md
│       ├── build-rn-screen.md
│       └── setup-firebase.md
│
├── GEMINI.md                               ← Project memory loaded by Antigravity on every task
│
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── ClassSelectScreen.tsx
│   │   ├── EncounterScreen.tsx
│   │   ├── CombatScreen.tsx
│   │   ├── MerchantScreen.tsx
│   │   ├── RecapScreen.tsx
│   │   └── DmThinkingScreen.tsx
│   │
│   ├── store/
│   │   └── gameStore.ts
│   │
│   ├── services/
│   │   ├── api.ts
│   │   └── firebase.ts
│   │
│   ├── models/
│   │   ├── types.ts
│   │   └── constants.ts
│   │
│   └── components/
│       ├── DmThinkingPanel.tsx
│       ├── ActionButton.tsx
│       ├── StatBar.tsx
│       └── ItemCard.tsx
│
├── functions/                              ← JAVASCRIPT ONLY — NO .ts FILES, NO tsconfig.json
│   ├── index.js                            ← Exports all Cloud Functions (CommonJS)
│   ├── firebase-init.js                    ← Firebase Admin SDK init (CommonJS)
│   ├── agents/
│   │   ├── dm-agent.js
│   │   ├── rival-agent.js
│   │   ├── loot-agent.js
│   │   └── recap-agent.js
│   ├── prompts/
│   │   ├── dm-prompt.js
│   │   ├── rival-prompt.js
│   │   ├── loot-prompt.js
│   │   └── recap-prompt.js
│   └── package.json                        ← No TypeScript dependencies
│
├── assets/
│   └── images/
│       └── icon.png
│
├── App.tsx
├── app.json
├── firebase.json
├── firestore.rules
├── eas.json
└── .env                                    ← NEVER commit this file
```

---

## SECTION 3: ANTIGRAVITY CONFIG FILES

### GEMINI.md (project root)

Create `GEMINI.md` with exactly this content. This file is loaded automatically by Antigravity before every task:

```markdown
# Realm Explorer — Project Context

## What this project is
A mobile roguelike RPG where an AI Dungeon Master generates every encounter,
enemy, dialogue, and reward in real time based on player behaviour.
Built for the Google Antigravity Hackathon — Challenge 4.

## Tech stack
- Frontend: React Native + Expo (TypeScript — .tsx/.ts files only in src/)
- Backend: Firebase Cloud Functions (JavaScript ONLY — .js files, CommonJS require/module.exports)
- Database: Firebase Firestore
- AI: Gemini 2.0 Flash via @google/generative-ai
- Hosting: Firebase Hosting (web build via npx expo export --platform web)

## The four runtime agents (JavaScript Cloud Functions)
1. dmAgent      — generates each floor encounter based on player history
2. rivalAgent   — controls enemy behaviour and resolves combat
3. lootAgent    — generates contextual item rewards
4. recapAgent   — writes the end-of-run narrative story

## Key rules
- functions/ is JavaScript ONLY. No .ts files, no tsconfig.json, use require() not import
- src/ is TypeScript ONLY. No .js files.
- All Gemini API calls happen inside Cloud Functions, never in the app
- All game state must be saved to Firestore before a function returns
- All functions must return JSON and include a hardcoded fallback on error

## File locations
- Cloud Functions: /functions/agents/ (.js files)
- Gemini prompts: /functions/prompts/ (.js module.exports)
- React Native screens: /src/screens/ (.tsx files)
- Global state: /src/store/gameStore.ts (Zustand)
- All Cloud Function HTTP calls: /src/services/api.ts
- Agent workflow log: /.agent/workflow_log.md (append after every workflow)
```

---

### .agent/rules.md (always-on agent rules)

Create `.agent/rules.md` with exactly this content:

```markdown
# Realm Explorer — Antigravity Agent Rules

## Language Rules — STRICTLY ENFORCED
- Frontend (src/): TypeScript ONLY — .ts and .tsx files
- Backend (functions/): JavaScript ONLY — .js files, CommonJS syntax
- In functions/: use require() not import; use module.exports not export
- In functions/: NEVER create tsconfig.json or install TypeScript packages
- Never mix languages between frontend and backend directories

## File Organisation
- All screens → /src/screens/ as .tsx files
- Global state → /src/store/gameStore.ts (Zustand)
- All backend calls → /src/services/api.ts (TypeScript)
- All Firebase Cloud Functions → /functions/agents/ as .js files
- All Gemini prompts → /functions/prompts/ as .js files with module.exports
- All TypeScript types → /src/models/types.ts

## Security
- Never hardcode API keys anywhere
- Gemini API key → Firebase Functions environment config only (process.env.GEMINI_API_KEY)
- Firebase client config → src/services/firebase.ts (this config object is non-secret)
- .env file → add to .gitignore immediately

## Cloud Functions (JavaScript — CommonJS)
- All functions use: const functions = require('firebase-functions')
- All functions use: const { db } = require('../firebase-init.js')  ← note the .js extension
- All functions must return JSON
- All functions must have try/catch with a hardcoded fallback response
- All functions must include CORS headers (Access-Control-Allow-Origin: *)
- All functions must handle OPTIONS preflight requests
- All functions must write their output to Firestore before returning

## React Native Components (TypeScript)
- Background colour: #1A1A2E
- Primary accent: #1D9E75
- Danger/enemy accent: #D85A30
- Primary text: #FFFFFF
- Secondary text: #B0B0C0
- All styles via StyleSheet.create() — no inline style objects
- Navigation: @react-navigation/stack
- All screens must show DmThinkingPanel while any agent call is in progress
- All screens must show a retry button on error state

## Agentic Workflow Logging (MANDATORY)
- .agent/workflow_log.md must be updated after EVERY workflow execution
- Log format: Timestamp, Workflow Name, Trigger, Reasoning, Actions, Output, Status
- This file is a hackathon deliverable — treat it with the same importance as code

## Game State
- RunState shape is defined in /src/models/types.ts — never deviate from it
- playStyle is always derived from actionHistory, never set directly by the player
- All run data must be persisted to Firestore in real-time
```

---

## SECTION 4: WORKFLOW DEFINITIONS

Create each workflow file inside `.agent/workflows/`. These are the slash-command instructions Antigravity follows when a workflow is invoked by typing `/workflow-name` in the Agent Manager.

Each workflow file uses YAML frontmatter delimited by `---` followed by numbered steps in markdown.

---

### `.agent/workflows/setup-firebase.md`

```markdown
---
description: Initialise Firebase project structure and JavaScript functions directory
---

1. Create /functions/package.json:
   - "name": "realm-explorer-functions"
   - "version": "1.0.0"
   - "main": "index.js"
   - "engines": { "node": "20" }
   - dependencies: firebase-functions ^4.0.0, firebase-admin ^12.0.0, @google/generative-ai ^0.1.0
   - NO TypeScript, NO ts-node, NO @types packages
   // turbo
   cd functions && npm install

2. Create /functions/firebase-init.js using CommonJS:
   const admin = require('firebase-admin');
   if (!admin.apps.length) { admin.initializeApp(); }
   const db = admin.firestore();
   module.exports = { admin, db };

3. Create /functions/index.js as empty exports scaffold with comments for each agent.

4. Create firebase.json:
   hosting.public = "dist", functions.source = "functions"

5. Create firestore.rules with open read/write for hackathon.

6. Create eas.json with preview profile: android buildType = "apk"

7. Create app.json with:
   name: "Realm Explorer"
   slug: "realm-explorer"
   android.package: "com.yourname.realmexplorer"

8. Append log entry to .agent/workflow_log.md
```

---

### `.agent/workflows/build-dm-agent.md`

```markdown
---
description: Create the Dungeon Master agent as a Firebase Cloud Function in JavaScript
---

1. Read GEMINI.md and .agent/rules.md to confirm JavaScript-only backend rules.

2. Create /functions/prompts/dm-prompt.js:
   - Use module.exports = { buildDmPrompt }
   - buildDmPrompt({ floorNumber, playerClass, hp, playStyle, actionHistory, eventLog }) returns a string
   - Prompt instructs Gemini: respond ONLY with valid JSON, no markdown, no preamble
   - JSON schema: encounterTitle, narrativeText, enemyName, enemyType, availableActions, difficultyWeight, dmReasoning
   - enemyType: one of "combat", "negotiation", "hybrid"
   - availableActions: array of 3-5 strings
   - difficultyWeight: integer 1-5
   - dmReasoning: plain-English explanation of why this encounter was generated
   - Prompt includes adaptation rules by playStyle:
     aggressive → combat enemies, high difficulty
     diplomatic → hybrid/negotiation enemies
     cautious → trap and stealth encounters
     unpredictable → randomised types
   - If hp < 30% of max: reduce difficulty

3. Create /functions/agents/dm-agent.js using CommonJS (require/module.exports):
   - const functions = require('firebase-functions')
   - const { GoogleGenerativeAI } = require('@google/generative-ai')
   - const { db } = require('../firebase-init.js')
   - const { buildDmPrompt } = require('../prompts/dm-prompt.js')
   - Export: exports.dmAgent = functions.https.onRequest(async (req, res) => { ... })
   - CORS headers + OPTIONS preflight at the top
   - Destructure body: runId, playerId, floorNumber, playerClass, hp, playStyle, actionHistory, eventLog
   - Call Gemini: new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
   - Strip markdown fences before JSON.parse: text.replace(/```json|```/g, '').trim()
   - Save to Firestore: runs/{runId}/encounters/floor_{floorNumber}
   - Return: res.json({ success: true, encounter })
   - Fallback encounter on any error:
     { encounterTitle: "The Dark Corridor", narrativeText: "A goblin blocks your path, watching you with hungry eyes.",
       enemyName: "Tunnel Goblin", enemyType: "combat",
       availableActions: ["Attack", "Negotiate", "Examine", "Flee"],
       difficultyWeight: 2, dmReasoning: "Fallback encounter triggered due to API error." }

4. Update /functions/index.js:
   const { dmAgent } = require('./agents/dm-agent.js');
   exports.dmAgent = dmAgent;

5. Verify no syntax errors:
   // turbo
   cd functions && node -e "require('./index.js')" && echo "Syntax OK"

6. Append log entry to .agent/workflow_log.md with reasoning for prompt structure choices.
```

---

### `.agent/workflows/build-rival-agent.md`

```markdown
---
description: Create the enemy AI opponent as a Firebase Cloud Function in JavaScript
---

1. Create /functions/prompts/rival-prompt.js (CommonJS, module.exports):
   - buildRivalPrompt({ enemyName, enemyType, enemyHp, playerAction, playerHp, playerClass, combatTurns })
   - Prompt instructs Gemini to respond ONLY with JSON:
     outcomeText, playerHpDelta, enemyHpDelta, combatOver, playerWon, winQuality, rivalReasoning
   - playerHpDelta: negative number (damage to player)
   - enemyHpDelta: negative number (damage to enemy)
   - winQuality: "clean" (≤2 turns), "close" (player HP < 40%), "messy" (everything else)
   - Fairness Referee rules in prompt:
     Floor 1 (combatTurns === 0): playerHpDelta must be no worse than -3
     combatTurns > 3: enemy uses special move, magnitude +1
     combatTurns > 6: force combatOver true, playerWon false

2. Create /functions/agents/rival-agent.js (CommonJS):
   - Same CORS + preflight + require() pattern as dm-agent.js
   - After parsing Gemini response, apply Fairness Referee validation in code:
     if (combatTurns === 0 && Math.abs(result.playerHpDelta) > 3) result.playerHpDelta = -3;
     if (combatTurns > 6) result = { ...result, combatOver: true, playerWon: false };
   - Save to Firestore: runs/{runId}/combat subcollection
   - Fallback: outcomeText "The enemy stumbles back.", playerHpDelta -1, enemyHpDelta -2,
     combatOver false, playerWon false, winQuality "messy", rivalReasoning "Fallback combat."

3. Update /functions/index.js with: exports.rivalAgent = require('./agents/rival-agent.js').rivalAgent

4. Verify:
   // turbo
   cd functions && node -e "require('./index.js')" && echo "Syntax OK"

5. Append log entry to .agent/workflow_log.md
```

---

### `.agent/workflows/build-loot-agent.md`

```markdown
---
description: Create the contextual item reward generator in JavaScript
---

1. Create /functions/prompts/loot-prompt.js (CommonJS, module.exports):
   - buildLootPrompt({ playerClass, playStyle, floorNumber, winQuality, eventLog })
   - JSON schema: itemName, itemEffect, styleNote, flavorText, itemType
   - itemType: "weapon" | "armor" | "ring" | "consumable"
   - styleNote: why this item suits this player's play style
   - flavorText: atmospheric lore sentence referencing eventLog events
   - Power scaling: clean win → powerful item, messy win → weaker item

2. Create /functions/agents/loot-agent.js (CommonJS):
   - Standard require() pattern
   - Save single item: runs/{runId}/loot subcollection
   - Merchant mode: if (req.body.merchantMode === true) call Gemini 3 times, return items array
   - Fallback: { itemName: "Worn Dagger", itemEffect: "+1 to next attack",
     styleNote: "A basic blade for any adventurer.",
     flavorText: "Its edge is dull but its intent is clear.", itemType: "weapon" }

3. Update /functions/index.js with lootAgent export

4. Verify syntax, append log to .agent/workflow_log.md
```

---

### `.agent/workflows/build-recap-agent.md`

```markdown
---
description: Create the end-of-run narrative generator in JavaScript
---

1. Create /functions/prompts/recap-prompt.js (CommonJS, module.exports):
   - buildRecapPrompt({ playerClass, finalHp, floorsCompleted, died, gold, playStyle, eventLog, inventory })
   - JSON schema: narrativeText, runTitle
   - narrativeText: 3-5 sentences, second-person ("You descended into...")
   - Must reference at least 2 specific events from eventLog
   - Must reference player class and play style
   - runTitle: unique 2-5 word title specific to this run — never generic

2. Create /functions/agents/recap-agent.js (CommonJS):
   - Standard require() pattern
   - After Gemini call, update player profile using FieldValue:
     const { admin } = require('../firebase-init.js');
     db.collection('players').doc(playerId).set({
       runsCompleted: admin.firestore.FieldValue.increment(1),
       allTimeTitles: admin.firestore.FieldValue.arrayUnion(recap.runTitle)
     }, { merge: true })
   - Save recap: players/{playerId}/recaps/{runId}
   - Fallback: { narrativeText: "Your run ended in darkness, but the dungeon remembers your name.",
     runTitle: "The Unknown Wanderer" }

3. Update /functions/index.js with recapAgent export

4. Verify syntax, append log to .agent/workflow_log.md
```

---

### `.agent/workflows/build-rn-screen.md`

```markdown
---
description: Scaffold a new TypeScript screen for the Realm Explorer mobile app
---

1. When invoked, identify the [SCREEN_NAME] from the task.

2. Create /src/screens/[SCREEN_NAME].tsx as a default-exported functional component.
   All screens MUST:
   - Be written in TypeScript (.tsx)
   - Import and use useGameStore() from /src/store/gameStore.ts
   - Import and use useNavigation() from @react-navigation/native
   - Show DmThinkingPanel when isThinking === true
   - Show a retry TouchableOpacity when in error state
   - Use StyleSheet.create() for all styles at the bottom — no inline style objects
   - Use SafeAreaView as the root wrapper

3. Colour tokens (exact hex values):
   Background: #1A1A2E | Card/surface: #2A2A4E | Accent: #1D9E75
   Danger: #D85A30 | Text: #FFFFFF | Secondary text: #B0B0C0
   Muted: #555555 | Border: #3A3A6E

4. Data fetching pattern:
   - Fetch in useEffect on mount
   - setThinking(true, "message") before any api.ts call
   - setThinking(false) in the finally block

5. Append screen creation log entry to .agent/workflow_log.md
```

---

## SECTION 5: GLOBAL STATE SETUP

Create `src/store/gameStore.ts` with the Zustand store. The store must manage:

- `run: RunState | null` — the active run
- `currentEncounter: Encounter | null` — the current floor encounter
- `isThinking: boolean` — controls DmThinkingPanel
- `thinkingMessage: string` — status text during agent calls
- `profile: PlayerProfile | null` — player's persisted profile

Actions required: `setRun`, `updateRun`, `setCurrentEncounter`, `addToInventory`, `setThinking`, `setProfile`, `resetRun`.

The `playStyle` is NEVER set directly. It is always derived from `actionHistory` by the `derivePlayStyle()` helper function in `EncounterScreen.tsx`. The store stores the derived value in `run.playStyle` after derivation.

---

## SECTION 6: API SERVICE LAYER

Create `src/services/api.ts`. This file is the ONLY place where Cloud Function URLs are referenced. It must export these four async functions, each making a POST request to the corresponding Cloud Function:

- `callDmAgent(params)` → calls `/dmAgent`
- `callRivalAgent(params)` → calls `/rivalAgent`
- `callLootAgent(params)` → calls `/lootAgent`
- `callRecapAgent(params)` → calls `/recapAgent`

The `BASE_URL` must be constructed from a constant at the top of the file using the Firebase project ID. All functions must `throw` on non-OK responses so callers can catch them.

---

## SECTION 7: STEP-BY-STEP BUILD INSTRUCTIONS

Execute these steps in order. Log each step's completion to `.agent/workflow_log.md`.

### Phase 1: Environment Preparation

**Step 1.1 — Create Expo project**
```bash
npx create-expo-app realm-explorer --template expo-template-blank-typescript
cd realm-explorer
```

**Step 1.2 — Install all frontend dependencies**
```bash
npx expo install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
npx expo install firebase
npm install zustand
npm install react-native-uuid
npx expo install react-native-reanimated lottie-react-native
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-web react-dom @expo/webpack-config
```

**Step 1.3 — Initialise Firebase functions directory (JavaScript only)**
```bash
mkdir functions && cd functions
npm init -y
npm install firebase-functions firebase-admin @google/generative-ai
cd ..
```
> Do NOT run `tsc --init`, do NOT install TypeScript here.

**Step 1.4 — Initialise Firebase project**
```bash
firebase login
firebase init
# Select: Firestore, Functions, Hosting
# Functions language: JavaScript (NOT TypeScript)
# Do NOT install ESLint when prompted
```

**Step 1.5 — Set Gemini API key in Firebase config**
```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY_HERE"
```

**Step 1.6 — Add .env to .gitignore**
Append to `.gitignore`:
```
.env
functions/.env
```

---

### Phase 2: Backend — JavaScript Cloud Functions

**Step 2.1** — Run workflow `/setup-firebase` → Creates `functions/index.js`, `functions/firebase-init.js`, `firebase.json`, `firestore.rules`, `eas.json`, `app.json`. Log to `.agent/workflow_log.md`.

**Step 2.2** — Run workflow `/build-dm-agent` → Creates `functions/prompts/dm-prompt.js` and `functions/agents/dm-agent.js`. Deploy and test:
```bash
firebase deploy --only functions:dmAgent
curl -X POST https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/dmAgent \
  -H "Content-Type: application/json" \
  -d '{"runId":"test1","playerId":"p1","floorNumber":1,"playerClass":"shadow_rogue","hp":9,"playStyle":"cautious","actionHistory":[],"eventLog":[]}'
```
Expected: `{ "success": true, "encounter": { ... } }` — Log result to `.agent/workflow_log.md`.

**Step 2.3** — Run workflow `/build-rival-agent`. Deploy and test. Log.

**Step 2.4** — Run workflow `/build-loot-agent`. Deploy and test. Log.

**Step 2.5** — Run workflow `/build-recap-agent`. Deploy and test. Log.

**Step 2.6** — Full backend integration test: call all four agents in sequence with curl. Verify Firestore documents are created. Log.

---

### Phase 3: Frontend — React Native TypeScript

**Step 3.1** — Create folder structure as defined in Section 2.

**Step 3.2** — Create `src/models/types.ts` with all TypeScript interfaces.

**Step 3.3** — Create `src/models/constants.ts` with three character class definitions.

**Step 3.4** — Create `src/store/gameStore.ts` as specified in Section 5.

**Step 3.5** — Create `src/services/firebase.ts` with Firebase client initialisation and Firestore helpers.

**Step 3.6** — Create `src/services/api.ts` as specified in Section 6.

**Step 3.7** — Create `src/components/StatBar.tsx` — HP bar with colour coding.

**Step 3.8** — Create `src/components/DmThinkingPanel.tsx` — Pulsing dot + status message.

**Step 3.9** — Create `src/components/ActionButton.tsx` — Styled TouchableOpacity.

**Step 3.10** — Create `src/components/ItemCard.tsx` — Loot item display card.

**Step 3.11** — Run `/build-rn-screen` for `HomeScreen`.

**Step 3.12** — Run `/build-rn-screen` for `ClassSelectScreen`.

**Step 3.13** — Run `/build-rn-screen` for `EncounterScreen` — core screen with `derivePlayStyle()`, `loadEncounter()`, `handleAction()`, DM Reasoning panel, floor progression.

**Step 3.14** — Run `/build-rn-screen` for `MerchantScreen`.

**Step 3.15** — Run `/build-rn-screen` for `RecapScreen` — typewriter animation, run title badge, "Play Again" button.

**Step 3.16** — Create `App.tsx` with NavigationContainer, Stack.Navigator, all screens registered, player profile init on mount.

---

### Phase 4: Integration Testing

**Step 4.1** — `npx expo start` → complete a full run on Android emulator.

**Step 4.2** — Verify Firestore documents exist at:
- `players/{playerId}`
- `runs/{runId}`
- `runs/{runId}/encounters/floor_1` through `floor_5`
- `players/{playerId}/recaps/{runId}`

**Step 4.3** — Test error handling: provide a wrong Gemini API key, confirm fallback encounters load.

**Step 4.4** — Log all results to `.agent/workflow_log.md`.

---

### Phase 5: Polish

**Step 5.1** — Add loading skeleton screens for all agent call wait states.

**Step 5.2** — Add collapsible "DM's Reasoning" panel to EncounterScreen displaying `dmReasoning`.

**Step 5.3** — Add micro-animations: HP bar animates on change, action buttons use Animated.spring on press.

**Step 5.4** — Final `.agent/workflow_log.md` review — add summary section listing all agents built, tools called, total Firestore writes, total Gemini calls.

---

## SECTION 8: FINAL WORKFLOW LOG SUMMARY TEMPLATE

When the build is complete, prepend this summary to `.agent/workflow_log.md`:

```markdown
# Realm Explorer — Antigravity Workflow Log
## Build Summary

**Project:** Realm Explorer — Agentic Dungeon Crawler
**Hackathon:** Google Antigravity Hackathon — Challenge 4
**Build Date:** [Date]

### Agents Built
- [x] DM Agent (dmAgent) — JavaScript Cloud Function (.js)
- [x] Rival Agent (rivalAgent) — JavaScript Cloud Function (.js)
- [x] Loot Agent (lootAgent) — JavaScript Cloud Function (.js)
- [x] Recap Agent (recapAgent) — JavaScript Cloud Function (.js)

### Workflows Executed
| Workflow | Status | Timestamp |
|---|---|---|
| setup-firebase | ✅ | |
| build-dm-agent | ✅ | |
| build-rival-agent | ✅ | |
| build-loot-agent | ✅ | |
| build-recap-agent | ✅ | |
| build-rn-screen (x5) | ✅ | |

### Agentic Decisions Made
[List key architectural decisions made by Antigravity with reasoning]

### Firestore Collections Created
- players/
- runs/
- runs/{id}/encounters/
- runs/{id}/combat/
- runs/{id}/loot/
- players/{id}/recaps/

---
[Individual workflow log entries below]
```
