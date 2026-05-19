# Backend Task List
# Realm Explorer — Agentic Dungeon Crawler
### Agile Backlog · Backend Team Only

> **Target file path in repo:** `backend/docs/Backend_Task_List.md`

---

## Epic 1 — Project Setup & Configuration

### TASK-BE-001
**Title:** Initialise `functions/` directory as JavaScript-only Node.js project

**Acceptance Criteria:**
- `functions/package.json` present with `"main": "index.js"`, `"engines": { "node": "20" }`
- Dependencies installed: `firebase-functions`, `firebase-admin`, `@google/generative-ai`, `express`, `cors`, `uuid`
- Zero TypeScript packages in `package.json`
- Zero `.ts` files anywhere in `functions/`
- `npm install` runs without errors

**Files:**
- `functions/package.json`

---

### TASK-BE-002
**Title:** Create `firebase-init.js` — shared Admin SDK initialisation

**Acceptance Criteria:**
- Uses `require('firebase-admin')`
- Guards against double-init: `if (!admin.apps.length)`
- Exports `{ admin, db }` via `module.exports`
- No hardcoded project ID

**Files:**
- `functions/firebase-init.js`

---

### TASK-BE-003
**Title:** Create `functions/index.js` — Express app entry point and Cloud Function export

**Acceptance Criteria:**
- Initialises Express app
- Registers `corsMiddleware` and `express.json()` globally
- Mounts `agentRoutes` at root (`/`)
- Registers `errorHandler` as final middleware
- Exports `exports.api = functions.https.onRequest(app)`
- Running `node -e "require('./index.js')"` exits without error

**Files:**
- `functions/index.js`

---

### TASK-BE-004
**Title:** Set Gemini API key in Firebase Functions config

**Acceptance Criteria:**
- `firebase functions:config:set gemini.key="KEY"` executed
- `firebase functions:config:get` shows `{ "gemini": { "key": "..." } }`
- `.env` and `functions/.env` present in `.gitignore`
- No key appears in any committed file

---

## Epic 2 — Firebase & Firestore Configuration

### TASK-BE-005
**Title:** Define `firebase.json` — hosting and functions config

**Acceptance Criteria:**
- `hosting.public = "dist"`
- `functions.source = "functions"`
- Hosting rewrites: `{ "source": "**", "destination": "/index.html" }`

**Files:**
- `firebase.json`

---

### TASK-BE-006
**Title:** Write Firestore security rules

**Acceptance Criteria:**
- `players/{playerId}` — read/write allowed only if `request.auth.uid == playerId`
- `players/{playerId}/recaps/{runId}` — read only for matching uid; write blocked
- `runs/{runId}` — read if `playerId == request.auth.uid`; create allowed; update/delete blocked
- Subcollections (`encounters`, `combat`, `loot`) — read for authenticated users only; write blocked
- Rules deploy with `firebase deploy --only firestore:rules` without error

**Files:**
- `firestore.rules`

---

### TASK-BE-007
**Title:** Create Firestore model factory functions

**Acceptance Criteria:**
- `buildRun(params)` returns a complete `runs/{runId}` document shape including `startedAt: FieldValue.serverTimestamp()`
- `buildEncounter(params)` returns a complete encounter subdoc shape
- `buildPlayerUpdate(params)` returns a partial player profile update with `FieldValue.increment` and `FieldValue.arrayUnion` as values
- `buildItem(params)` returns a loot subdoc shape
- All functions validate that required fields are present, throw `Error` if not

**Files:**
- `functions/models/runModel.js`
- `functions/models/encounterModel.js`
- `functions/models/playerModel.js`
- `functions/models/itemModel.js`

---

## Epic 3 — Service Layer

### TASK-BE-008
**Title:** Implement `firestoreService.js` — all Firestore write helpers

**Acceptance Criteria:**
- Exports: `createRun`, `saveEncounter`, `saveCombat`, `saveLoot`, `saveRecap`, `updatePlayerProfile`, `updateRunState`
- All writes use `set({ merge: true })`
- `updatePlayerProfile` uses `FieldValue.increment(1)` for `runsCompleted` and `FieldValue.arrayUnion(title)` for `allTimeTitles`
- All documents receive `timestamp: FieldValue.serverTimestamp()`
- All functions are `async` and return a resolved Promise on success

**Files:**
- `functions/services/firestoreService.js`

---

### TASK-BE-009
**Title:** Implement `geminiService.js` — Gemini API call wrappers for all four agents

**Acceptance Criteria:**
- Single `GoogleGenerativeAI` instance initialised with `process.env.GEMINI_API_KEY`
- Model: `gemini-2.0-flash`
- Each exported function (`callDm`, `callRival`, `callLoot`, `callRecap`) calls the relevant prompt builder, calls `model.generateContent`, strips markdown fences, JSON-parses the result, and returns the parsed object
- Throws descriptive `Error` on API failure, parse failure, or empty response
- No fallback logic inside this service — fallbacks live in `errorHandler.js`

**Files:**
- `functions/services/geminiService.js`

---

### TASK-BE-010
**Title:** Implement `fairnessService.js` — Rival Agent post-parse validation

**Acceptance Criteria:**
- `validate(rivalResult, combatTurns, playerHp)` function exported
- Clamps `playerHpDelta` to `-3` if `combatTurns === 0 && Math.abs(playerHpDelta) > 3`
- Forces `combatOver: true, playerWon: false` if `combatTurns > 6`
- Recalculates `winQuality` if missing or invalid: `"clean"` if turns ≤ 2, `"close"` if player HP after combat < 40% of max, `"messy"` otherwise
- Returns the corrected result object
- Pure function — no side effects, no Firestore calls

**Files:**
- `functions/services/fairnessService.js`

---

## Epic 4 — Prompt Engineering

### TASK-BE-011
**Title:** Build DM Agent prompt builder — `dm-prompt.js`

**Acceptance Criteria:**
- Exports `buildDmPrompt({ floorNumber, playerClass, hp, maxHp, playStyle, actionHistory, eventLog })`
- Returns a single string
- Prompt instructs Gemini to return ONLY valid JSON — no markdown, no preamble
- Output schema defined inline: `encounterTitle`, `narrativeText`, `enemyName`, `enemyType`, `availableActions`, `difficultyWeight`, `dmReasoning`
- Adaptation rules embedded verbatim per PRD: aggressive → combat, diplomatic → hybrid, cautious → trap/stealth, unpredictable → randomised
- Low-HP rule: if `hp < maxHp * 0.3`, instruct DM to reduce `difficultyWeight` by 1

**Files:**
- `functions/prompts/dm-prompt.js`

---

### TASK-BE-012
**Title:** Build Rival Agent prompt builder — `rival-prompt.js`

**Acceptance Criteria:**
- Exports `buildRivalPrompt({ enemyName, enemyType, enemyHp, playerAction, playerHp, playerClass, combatTurns })`
- Output schema: `outcomeText`, `playerHpDelta`, `enemyHpDelta`, `combatOver`, `playerWon`, `winQuality`, `rivalReasoning`
- Prompt states: `playerHpDelta` must be a negative number, `enemyHpDelta` must be a negative number
- Fairness rules stated in prompt (code enforcement is a separate safety net in `fairnessService.js`)
- Special move escalation for `combatTurns > 3` stated in prompt

**Files:**
- `functions/prompts/rival-prompt.js`

---

### TASK-BE-013
**Title:** Build Loot Agent prompt builder — `loot-prompt.js`

**Acceptance Criteria:**
- Exports `buildLootPrompt({ playerClass, playStyle, floorNumber, winQuality, eventLog })`
- Output schema: `itemName`, `itemEffect`, `styleNote`, `flavorText`, `itemType`
- Power scaling stated: `clean` win → high-power item, `messy` win → weak item
- `styleNote` must explain why the item suits this specific player's observed behaviour
- `flavorText` must reference at least one event from `eventLog`
- Merchant mode handled: caller calls this builder 3 times with slight variation each call

**Files:**
- `functions/prompts/loot-prompt.js`

---

### TASK-BE-014
**Title:** Build Recap Agent prompt builder — `recap-prompt.js`

**Acceptance Criteria:**
- Exports `buildRecapPrompt({ playerClass, finalHp, floorsCompleted, died, gold, playStyle, eventLog, inventory })`
- Output schema: `narrativeText`, `runTitle`
- `narrativeText`: second-person, 3–5 sentences, references ≥ 2 specific events from `eventLog`
- `runTitle`: unique 2–5 words, must reflect actual run events — never generic

**Files:**
- `functions/prompts/recap-prompt.js`

---

## Epic 5 — Controllers & Middleware

### TASK-BE-015
**Title:** Implement `corsMiddleware.js`

**Acceptance Criteria:**
- Sets response headers: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: POST, GET, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`
- Returns `200` with empty body on `OPTIONS` requests (preflight)
- Calls `next()` for all other methods

**Files:**
- `functions/middleware/corsMiddleware.js`

---

### TASK-BE-016
**Title:** Implement `validate.js` — request body validation middleware

**Acceptance Criteria:**
- Configurable: `validate(requiredFields)` returns an Express middleware function
- Returns `400` with `{ success: false, error: "Missing required field: <field>" }` if any required field is absent, `null`, or `undefined`
- Calls `next()` if all required fields are present

**Files:**
- `functions/middleware/validate.js`

---

### TASK-BE-017
**Title:** Implement `errorHandler.js` — global Express error handler with fallbacks

**Acceptance Criteria:**
- Function signature: `(err, req, res, next)`
- Logs error message via `console.error`
- Returns `500` with route-specific fallback JSON keyed on `req.path`
- Fallback for `/api/v1/dm`: full encounter object with `dmReasoning: "Fallback encounter."`
- Fallback for `/api/v1/rival`: full rival result with `winQuality: "messy"`
- Fallback for `/api/v1/loot`: Worn Dagger item object
- Fallback for `/api/v1/recap`: generic narrative and title
- Unknown routes: returns `{ success: false, error: "Unknown endpoint" }`

**Files:**
- `functions/middleware/errorHandler.js`

---

### TASK-BE-018
**Title:** Implement `dmController.js`

**Acceptance Criteria:**
- Route: `POST /api/v1/dm`
- `validate` middleware requires: `runId, playerId, floorNumber, playerClass, hp, playStyle, actionHistory, eventLog`
- Calls `geminiService.callDm(body)` → receives parsed encounter
- Calls `firestoreService.saveEncounter(runId, floorNumber, encounter)`
- Returns `{ success: true, data: { encounter } }`
- Passes all errors to `next(err)`

**Files:**
- `functions/controllers/dmController.js`

---

### TASK-BE-019
**Title:** Implement `rivalController.js`

**Acceptance Criteria:**
- Route: `POST /api/v1/rival`
- `validate` middleware requires: `runId, enemyName, enemyType, enemyHp, playerAction, playerHp, playerClass, combatTurns`
- Calls `geminiService.callRival(body)`
- Passes result through `fairnessService.validate(result, combatTurns, playerHp)`
- Calls `firestoreService.saveCombat(runId, validatedResult)`
- Returns `{ success: true, data: { combat: validatedResult } }`

**Files:**
- `functions/controllers/rivalController.js`

---

### TASK-BE-020
**Title:** Implement `lootController.js`

**Acceptance Criteria:**
- Route: `POST /api/v1/loot`
- Supports optional `merchantMode: true` — when true, calls `geminiService.callLoot` 3 times and returns `{ success: true, data: { items: [...] } }`
- Normal mode: calls once, saves to `runs/{runId}/loot/{uuid}`, returns `{ success: true, data: { item } }`

**Files:**
- `functions/controllers/lootController.js`

---

### TASK-BE-021
**Title:** Implement `recapController.js`

**Acceptance Criteria:**
- Route: `POST /api/v1/recap`
- `validate` middleware requires: `runId, playerId, playerClass, finalHp, floorsCompleted, died, gold, playStyle, eventLog, inventory`
- Calls `geminiService.callRecap(body)`
- Saves recap to `players/{playerId}/recaps/{runId}`
- Calls `firestoreService.updatePlayerProfile(playerId, { runTitle, floorsCompleted, playerClass })`
- Returns `{ success: true, data: { recap } }`

**Files:**
- `functions/controllers/recapController.js`

---

### TASK-BE-022
**Title:** Implement `routes/agentRoutes.js`

**Acceptance Criteria:**
- All 4 agent routes registered with correct HTTP methods and paths
- `GET /api/v1/health` returns `{ status: "ok", timestamp: new Date().toISOString() }`
- Each POST route wraps its controller method in the correct `validate([...])` middleware

**Files:**
- `functions/routes/agentRoutes.js`

---

## Epic 6 — Deployment & Integration Testing

### TASK-BE-023
**Title:** Deploy Firestore security rules

**Acceptance Criteria:**
- `firebase deploy --only firestore:rules` completes with no errors
- Manual verification in Firebase Console that rules are active

---

### TASK-BE-024
**Title:** Deploy Cloud Functions

**Acceptance Criteria:**
- `firebase deploy --only functions:api` completes with no errors
- All 4 agent URLs printed in deploy output
- URLs copied into `src/services/api.ts` `BASE_URL`

---

### TASK-BE-025
**Title:** Smoke test all four agent endpoints with `curl`

**Acceptance Criteria:**
- `POST /api/v1/dm` returns `{ success: true, data: { encounter: { encounterTitle, narrativeText, enemyName, enemyType, availableActions, difficultyWeight, dmReasoning } } }`
- `POST /api/v1/rival` returns `{ success: true, data: { combat: { outcomeText, playerHpDelta, enemyHpDelta, combatOver, playerWon, winQuality, rivalReasoning } } }`
- `POST /api/v1/loot` returns `{ success: true, data: { item: { itemName, itemEffect, styleNote, flavorText, itemType } } }`
- `POST /api/v1/recap` returns `{ success: true, data: { recap: { narrativeText, runTitle } } }`
- Firestore documents exist after each curl call

---

### TASK-BE-026
**Title:** Test fallback handling — Gemini API failure simulation

**Acceptance Criteria:**
- Temporarily set an invalid `GEMINI_API_KEY`
- All four endpoints return their respective hardcoded fallback JSON with `200` status
- No blank or error responses returned to client

---

### TASK-BE-027
**Title:** Full sequential integration test — one complete dungeon run

**Acceptance Criteria:**
- Call `/api/v1/dm` for floors 1–5 in sequence with realistic payloads
- Call `/api/v1/rival` after each floor with the player action
- Call `/api/v1/loot` after floors 1–3 and 5
- Call `/api/v1/loot` with `merchantMode: true` for floor 4
- Call `/api/v1/recap` with complete run data
- Verify all Firestore documents: `runs/{runId}`, `runs/{runId}/encounters/floor_1..5`, `runs/{runId}/combat/*`, `runs/{runId}/loot/*`, `players/{playerId}/recaps/{runId}`, `players/{playerId}` updated

---

### TASK-BE-028
**Title:** Append all workflow logs to `.agent/workflow_log.md`

**Acceptance Criteria:**
- One log entry per deployed agent with `Timestamp`, `Workflow`, `Trigger`, `Agent/File`, `Reasoning`, `Actions Taken`, `Output`, `Status`
- Log entries for: `setup-firebase`, `build-dm-agent`, `build-rival-agent`, `build-loot-agent`, `build-recap-agent`
- Build summary section prepended per the Master Prompt template

**Files:**
- `.agent/workflow_log.md`
