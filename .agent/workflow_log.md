# Realm Explorer — Antigravity Workflow Log
## Build Summary

**Project:** Realm Explorer — Agentic Dungeon Crawler
**Hackathon:** Google Antigravity Hackathon — Challenge 4: The Mobile App Alchemy
**Build Date:** 2026-05-19

### Agents Built
- [x] Run Controller (POST /api/v1/run) — JavaScript Cloud Function via Express
- [x] DM Agent (dmAgent) — JavaScript Cloud Function (.js)
- [x] Rival Agent (rivalAgent) — JavaScript Cloud Function (.js) + Fairness Referee
- [x] Loot Agent (lootAgent) — JavaScript Cloud Function (.js) + Merchant Mode
- [x] Recap Agent (recapAgent) — JavaScript Cloud Function (.js)

### Workflows Executed
| Workflow | Status | Timestamp |
|---|---|---|
| setup-firebase | ✅ | 2026-05-19 |
| build-dm-agent | ✅ | 2026-05-19 |
| build-rival-agent | ✅ | 2026-05-19 |
| build-loot-agent | ✅ | 2026-05-19 |
| build-recap-agent | ✅ | 2026-05-19 |

### Agentic Decisions Made
- Single Express app exported as one Cloud Function (exports.api) chosen over four separate functions to reduce cold start surface and simplify CORS management.
- MVC structure adopted over flat agents/ directory to enable independent testing of services and separation of Firestore writes from Gemini calls.
- Fairness Referee implemented as code layer in fairnessService.js rather than relying solely on prompt constraints — ensures HP bounds are enforced even if Gemini ignores them.
- bestDepth update uses Firestore transaction to prevent shorter runs from overwriting longer run records.
- Gemini output schema validated post-parse to catch missing fields before they propagate to Firestore or the client.
- Player-controlled strings (playerAction, eventLog) sanitised and length-capped before prompt injection to prevent prompt injection attacks and control API costs.

### Firestore Collections Created
- players/{playerId}
- players/{playerId}/recaps/{runId}
- runs/{runId}
- runs/{runId}/encounters/floor_1..5
- runs/{runId}/combat/{id}
- runs/{runId}/loot/{id}

---

## 2026-05-19 15:25 — Workflow: setup-firebase

**Trigger:** Begin backend implementation
**Agent/File:** functions/index.js, functions/firebase-init.js, functions/package.json, firebase.json, firestore.rules, eas.json, app.json, .gitignore
**Reasoning:** Single Express app export chosen over individual function exports. Reduces Firebase billing surface and allows shared middleware (CORS, validate, errorHandler) to be registered once.
**Actions Taken:**
- Created functions/package.json with JavaScript-only dependencies
- Created functions/firebase-init.js with Admin SDK singleton pattern
- Created functions/index.js with Express app and exports.api
- Created firebase.json with hosting.public=dist, functions.source=functions
- Created firestore.rules with auth-gated read/write per collection
- Created eas.json with preview APK and production AAB profiles
- Created app.json with Realm Explorer slug and android package
- Created .gitignore covering .env, node_modules, dist, build artefacts
**Output:** Complete project scaffold, Firebase CLI ready for deploy
**Status:** ✅ Success

---

## 2026-05-19 15:36 — Workflow: build-dm-agent

**Trigger:** Backend Phase 4 — DM Agent controller and prompt
**Agent/File:** functions/prompts/dm-prompt.js, functions/controllers/dmController.js
**Reasoning:** DM prompt embeds all four playStyle adaptation rules (aggressive/diplomatic/cautious/unpredictable) and the low-HP rule (hp < 30% maxHp reduces difficultyWeight). Prompt forces JSON-only output with explicit schema definition. Low-HP rule requires maxHp to be passed — added maxHp to validate list.
**Actions Taken:**
- Created functions/prompts/dm-prompt.js with buildDmPrompt()
- Created functions/controllers/dmController.js
- Added 'maxHp' to validate list in agentRoutes.js for /dm route
- Registered POST /api/v1/dm in agentRoutes.js
**Output:** DM Agent endpoint operational at POST /api/v1/dm
**Status:** ✅ Success

---

## 2026-05-19 15:37 — Workflow: build-rival-agent

**Trigger:** Backend Phase 4 — Rival Agent controller, prompt, Fairness Referee
**Agent/File:** functions/prompts/rival-prompt.js, functions/controllers/rivalController.js, functions/services/fairnessService.js
**Reasoning:** Fairness Referee implemented as code layer (fairnessService.validate) applied after Gemini parse — not relying on prompt constraints alone. This ensures HP bounds (Floor 1 cap: -3) and turn limit (>6 turns: force loss) are enforced regardless of model behaviour. Gold reward awarded on floor win: floorNumber × difficultyWeight × 2 gold. HP persisted to runs/{runId}.hp via updateRunAfterCombat. currentFloor incremented atomically using FieldValue.increment.
**Actions Taken:**
- Created functions/prompts/rival-prompt.js with buildRivalPrompt()
- Created functions/controllers/rivalController.js
- Created functions/services/fairnessService.js
- Added updateRunAfterCombat() to firestoreService.js
- Registered POST /api/v1/rival in agentRoutes.js
**Output:** Rival Agent endpoint operational at POST /api/v1/rival with Fairness Referee
**Status:** ✅ Success

---

## 2026-05-19 15:38 — Workflow: build-loot-agent

**Trigger:** Backend Phase 4 — Loot Agent with merchant mode
**Agent/File:** functions/prompts/loot-prompt.js, functions/controllers/lootController.js
**Reasoning:** Single loot endpoint handles both post-combat rewards and Floor 4 merchant inventory. merchantMode: true triggers 3 parallel Gemini calls (Promise.all) returning an items array. Each call receives a variation parameter to prevent identical items. Power scaling (clean/close/messy) embedded in prompt. styleNote and flavorText forced to reference run-specific data.
**Actions Taken:**
- Created functions/prompts/loot-prompt.js with buildLootPrompt()
- Created functions/controllers/lootController.js with merchantMode branch
- Added saveMerchantInventory() to firestoreService.js
- Registered POST /api/v1/loot in agentRoutes.js
**Output:** Loot Agent endpoint operational at POST /api/v1/loot
**Status:** ✅ Success

---

## 2026-05-19 15:38 — Workflow: build-recap-agent

**Trigger:** Backend Phase 4 — Recap Agent with profile update and run finalisation
**Agent/File:** functions/prompts/recap-prompt.js, functions/controllers/recapController.js
**Reasoning:** Recap Agent receives full eventLog and inventory to generate a run-specific narrative. Profile update uses Firestore transaction for bestDepth (prevents shorter runs from overwriting longer run records). Run status set to completed/died to close the run lifecycle. Prompt requires second-person voice, 3-5 sentences, references ≥2 eventLog events.
**Actions Taken:**
- Created functions/prompts/recap-prompt.js with buildRecapPrompt()
- Created functions/controllers/recapController.js
- Fixed updatePlayerProfile() in firestoreService.js to use transaction for bestDepth
- Added status update (completed/died) to run document on recap
- Registered POST /api/v1/recap in agentRoutes.js
**Output:** Recap Agent endpoint operational at POST /api/v1/recap
**Status:** ✅ Success

---

## 2026-05-20 11:00 — Frontend Chassis Build

**Trigger:** Master Prompt — Build React 18 + Vite + Tailwind v4 + Motion frontend chassis
**Agent/File:** frontend/ (complete new Vite project)
**Reasoning:** Built as a standalone Vite project inside `/frontend/` separate from the Expo React Native source. The chassis is a pure presentation layer with simulated delays replacing real API calls, allowing full UI demonstration without backend dependency. Mobile-device emulation chassis (390×780px) wraps all screens in a centered dark container with scanline overlay and notch decoration.

**Architecture Decisions:**
- `motion/react` for all animations — springs for HP bars, AnimatePresence for screen transitions, useAnimationControls for programmatic shake
- `displayHp` (hemorrhage lag) tracked separately from `currentHp` in Zustand — `syncDisplayHp()` called 500ms after damage to trigger ghost-bar catch-up
- `AudioHaptics` Web Audio API synthesizer: tick, click, dodge, heavy, gold, chord, shield — no external audio files needed
- Play style derivation (`derivePlayStyle`) reads last 8 actions from `actionHistory` — maps dominant style to border/glow color theme globally
- ActionButton renders 4 style themes: rose (aggressive), cyan (diplomatic), amber (cautious), violet (unpredictable)

**Files Created:**
- `frontend/vite.config.ts`, `frontend/tsconfig.json`
- `frontend/src/types.ts` — PlayerClass, CharacterClass, DungeonEncounter, CombatResult, GameItem, RunState, AnimationEvent
- `frontend/src/data.ts` — CLASSES, MOCK_ENCOUNTERS, MERCHANT_ITEMS, FLOOR_LOOT_ITEMS, PLAY_STYLE_TITLES
- `frontend/src/audio.ts` — AudioHaptics class
- `frontend/src/store.ts` — Zustand store with displayHp, combatLog, animQueue, recapText/Title
- `frontend/src/index.css` — Tailwind v4 + shake, red-flash, gold-pulse, shimmer, scanlines, typewriter-cursor animations
- `frontend/src/App.tsx` — AnimatePresence router with mobile chassis
- `frontend/src/components/` — ThinkingPanel, StatBar, ActionButton, ItemCard
- `frontend/src/screens/` — HomeScreen, ClassSelectScreen, EncounterScreen, MerchantScreen, RecapScreen

**Build Result:**
- TypeScript: 0 errors
- Vite build: ✓ 2042 modules, 339KB JS (108KB gzip), 4.3s
- Dev server: http://localhost:5173/

**Status:** ✅ Success
