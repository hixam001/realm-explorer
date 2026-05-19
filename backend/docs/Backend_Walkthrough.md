# Backend Walkthrough
# Realm Explorer — Agentic Dungeon Crawler
### Technical Narrative: Express Controllers → Antigravity Workflow → Firebase Realtime Updates

> **Target file path in repo:** `backend/docs/Backend_Walkthrough.md`

---

## Overview

This document is a step-by-step technical narrative of what happens on the backend during a single floor of Realm Explorer gameplay. It traces the exact journey of data from the React Native frontend, through the Express MVC layer, into the Gemini 2.0 Flash model, through the Fairness Referee, and finally into Firestore — from the moment the player selects their class to the moment the Recap story is written.

---

## 1. The Frontend Sends Telemetry — What Arrives at the Controller

When the player loads Floor 1 of a new run, the React Native app calls `src/services/api.ts`'s `callDmAgent()` function, which makes this HTTP POST to the backend:

```
POST https://us-central1-{PROJECT_ID}.cloudfunctions.net/api/v1/dm
Content-Type: application/json

{
  "runId": "run_8f3a2b",
  "playerId": "player_9c1d",
  "floorNumber": 1,
  "playerClass": "shadow_rogue",
  "hp": 9,
  "playStyle": "cautious",
  "actionHistory": [],
  "eventLog": []
}
```

The `playStyle` field is never set by the player. It is derived in `EncounterScreen.tsx` by `derivePlayStyle(actionHistory)` — a pure function that analyses the frequency distribution of past action types (attack, negotiate, flee, examine) and outputs a single label. On Floor 1, `actionHistory` is empty so `playStyle` defaults to `"cautious"` for a Shadow Rogue.

The `runId` was created when the player hit "Start Run" on the HomeScreen. The app called `POST /api/v1/run` (or directly wrote to Firestore via the Firebase client SDK) to create the initial `runs/{runId}` document.

---

## 2. Express Receives the Request — Middleware Pipeline

The request enters the Express app registered in `functions/index.js` and passes through the global middleware stack in this order:

**Step 2.1 — CORS Middleware (`corsMiddleware.js`)**

The function sets `Access-Control-Allow-Origin: *` and `Access-Control-Allow-Methods: POST, GET, OPTIONS` on the response before calling `next()`. If this were a preflight `OPTIONS` request from the browser web build, the middleware would return `200` immediately here and the request would end. For a standard `POST`, execution continues.

**Step 2.2 — `express.json()` body parser**

The raw JSON body is parsed into `req.body`. After this step, `req.body.runId`, `req.body.floorNumber`, etc. are all accessible as JavaScript values.

**Step 2.3 — Route Matching (`agentRoutes.js`)**

The router matches `POST /api/v1/dm` and invokes the `validate` middleware with the DM Agent's required field list before handing off to `dmController.generate`.

**Step 2.4 — `validate.js` middleware**

```javascript
const requiredFields = ['runId', 'playerId', 'floorNumber', 'playerClass', 'hp', 'playStyle', 'actionHistory', 'eventLog'];
```

The middleware iterates this array. Every field is present in `req.body`, so it calls `next()`. If `floorNumber` were missing, it would immediately return:

```json
{ "success": false, "error": "Missing required field: floorNumber" }
```

with HTTP status `400` and the request would terminate here.

---

## 3. The DM Controller — Orchestrating the First Agent Call

Execution enters `dmController.generate`:

```javascript
async function generate(req, res, next) {
  const { runId, playerId, floorNumber, playerClass, hp, playStyle, actionHistory, eventLog } = req.body;

  const encounter = await geminiService.callDm({ runId, playerId, floorNumber, playerClass, hp, playStyle, actionHistory, eventLog });

  await firestoreService.saveEncounter(runId, floorNumber, encounter);

  res.status(200).json({ success: true, data: { encounter } });
}
```

Any thrown error propagates to `next(err)` via the surrounding try/catch, which hands it to `errorHandler.js`.

---

## 4. The Gemini Service — Building and Sending the DM Prompt

`geminiService.callDm` calls `buildDmPrompt()` from `functions/prompts/dm-prompt.js`. The function assembles a structured instruction string. For this Floor 1 / Shadow Rogue / `cautious` scenario, the prompt communicates:

- The player is a `shadow_rogue` with `9 HP` on `floor 1`
- `playStyle` is `cautious`: generate trap and stealth-type encounters
- `actionHistory` is empty: no prior behaviour to penalise or reward
- Output ONLY valid JSON — no markdown, no preamble
- Required output schema: `encounterTitle`, `narrativeText`, `enemyName`, `enemyType`, `availableActions` (3–5 strings), `difficultyWeight` (1–5), `dmReasoning`

`geminiService` then calls:

```javascript
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const result = await model.generateContent(prompt);
const text = result.response.text();
const cleaned = text.replace(/```json|```/g, '').trim();
const encounter = JSON.parse(cleaned);
```

The Gemini model returns (after JSON-stripping):

```json
{
  "encounterTitle": "The Whispering Passage",
  "narrativeText": "A narrow corridor stretches ahead. You notice a thin wire strung across the floor at ankle height and a figure crouching in the shadows beyond.",
  "enemyName": "Silent Watcher",
  "enemyType": "hybrid",
  "availableActions": ["Step over the wire carefully", "Throw a stone to trigger the trap", "Attempt to communicate with the figure", "Retreat and find another way"],
  "difficultyWeight": 2,
  "dmReasoning": "Player is a Shadow Rogue on Floor 1 with full HP and a cautious play style. I selected a stealth/trap hybrid encounter at low difficulty to match their class fantasy and give them agency through deception or avoidance rather than combat."
}
```

The `dmReasoning` field is the live Antigravity agent trace made visible. This same value is exposed to the player in the collapsible DM Reasoning panel on the EncounterScreen.

---

## 5. Firestore Write — Persisting the Encounter

`firestoreService.saveEncounter(runId, floorNumber, encounter)` calls:

```javascript
db.collection('runs').doc(runId)
  .collection('encounters').doc(`floor_${floorNumber}`)
  .set({
    ...encounterModel.buildEncounter({ floorNumber, ...encounter }),
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
```

`buildEncounter` is the model factory that enforces the complete document shape, including default values for `playerChoice`, `outcome`, and `hpAfter` (all `null` at this point, to be updated when the player acts).

After the Firestore write resolves, the controller returns the encounter to the frontend.

---

## 6. The Player Makes a Choice — Rival Agent Receives Telemetry

The player reads the encounter and selects `"Step over the wire carefully"`. The frontend calls `callRivalAgent()` in `api.ts`:

```
POST /api/v1/rival
{
  "runId": "run_8f3a2b",
  "enemyName": "Silent Watcher",
  "enemyType": "hybrid",
  "enemyHp": 6,
  "playerAction": "Step over the wire carefully",
  "playerHp": 9,
  "playerClass": "shadow_rogue",
  "combatTurns": 0
}
```

The middleware pipeline runs again. `rivalController.resolve` is invoked.

---

## 7. The Rival Controller — Enemy AI and Fairness Enforcement

`rivalController.resolve` calls `geminiService.callRival(body)`. The prompt instructs the Rival Agent to:

- Act as the enemy AI deciding how the `Silent Watcher` responds to the player's stealth attempt
- Calculate `playerHpDelta` and `enemyHpDelta` as negative numbers
- Set `winQuality` based on engagement quality
- State its reasoning in `rivalReasoning`
- Fairness constraints stated in prompt: `combatTurns === 0` → `playerHpDelta` must not exceed `-3`

Gemini returns:

```json
{
  "outcomeText": "You ease over the wire with practiced silence. The Watcher senses motion but cannot pinpoint you. A brief exchange of shadows — your blade finds a gap in his guard.",
  "playerHpDelta": -1,
  "enemyHpDelta": -4,
  "combatOver": true,
  "playerWon": true,
  "winQuality": "clean",
  "rivalReasoning": "Player used a stealth action on turn 0. Shadow Rogue class bonus applied. Clean victory is appropriate — the trap avoidance gave a tactical advantage. HP delta kept mild per Floor 1 fairness rules."
}
```

Before the result reaches Firestore, it passes through `fairnessService.validate`:

```javascript
if (combatTurns === 0 && Math.abs(result.playerHpDelta) > 3) {
  result.playerHpDelta = -3;
}
if (combatTurns > 6) {
  result.combatOver = true;
  result.playerWon = false;
}
```

In this case `-1` does not exceed `-3`, so no clamping occurs. `combatTurns` is `0`, not `> 6`. The Gemini output passes validation unmodified.

`firestoreService.saveCombat(runId, validatedResult)` writes to `runs/{runId}/combat/{uuid}`. The encounter document at `runs/{runId}/encounters/floor_1` is also updated with `playerChoice: "Step over the wire carefully"`, `outcome: "success"`, `hpAfter: 8`.

---

## 8. Floor Win — Loot Agent Generates the Reward

Because `combatOver: true` and `playerWon: true`, the frontend calls `callLootAgent()`:

```
POST /api/v1/loot
{
  "runId": "run_8f3a2b",
  "playerId": "player_9c1d",
  "playerClass": "shadow_rogue",
  "playStyle": "cautious",
  "floorNumber": 1,
  "winQuality": "clean",
  "eventLog": ["Floor 1: Stepped over wire trap vs Silent Watcher — victory"]
}
```

`lootController.generate` calls `geminiService.callLoot`. The prompt instructs the Loot Agent:

- `winQuality: "clean"` → award a meaningful, powerful item
- `playStyle: "cautious"` → item should reward deception, evasion, or stealth
- `eventLog` contains one event — `flavorText` must reference it

Gemini returns:

```json
{
  "itemName": "Veil-Thread Bracers",
  "itemEffect": "Your first action each floor is made at advantage. On a stealth action, enemy HP delta is increased by 1.",
  "styleNote": "You avoided direct combat and used environmental awareness to neutralise a trap before it was triggered. These bracers reward exactly that style of measured, deliberate engagement.",
  "flavorText": "Woven from the shadow-silk of the passage you stalked, they seem to breathe with your footsteps.",
  "itemType": "armor"
}
```

`firestoreService.saveLoot` writes this to `runs/{runId}/loot/{uuid}`. The item is also appended to `runs/{runId}.inventory` via `updateRunState`.

---

## 9. Floor 4 — Merchant Mode (Loot Agent Called Three Times)

When the player reaches Floor 4, the frontend calls `callLootAgent` with `merchantMode: true`. `lootController.generate` detects this flag:

```javascript
if (req.body.merchantMode === true) {
  const items = await Promise.all([
    geminiService.callLoot({ ...body, variation: 1 }),
    geminiService.callLoot({ ...body, variation: 2 }),
    geminiService.callLoot({ ...body, variation: 3 })
  ]);
  await firestoreService.saveMerchantInventory(runId, items);
  return res.status(200).json({ success: true, data: { items } });
}
```

Three independent Gemini calls are made in parallel. Each returns a unique item with a distinct `itemType`. The three items are written to three separate `loot` subdocuments and returned to the frontend as an array for display on the MerchantScreen.

---

## 10. Run End — Recap Agent Writes the Story

After Floor 5 is cleared (or the player dies), the frontend calls `callRecapAgent()` with the full run context:

```
POST /api/v1/recap
{
  "runId": "run_8f3a2b",
  "playerId": "player_9c1d",
  "playerClass": "shadow_rogue",
  "finalHp": 4,
  "floorsCompleted": 5,
  "died": false,
  "gold": 35,
  "playStyle": "cautious",
  "eventLog": [
    "Floor 1: Stepped over wire trap vs Silent Watcher — victory",
    "Floor 2: Negotiated with Bandit King — partial success",
    "Floor 3: Set ambush vs Stone Sentinel — clean victory",
    "Floor 4: Purchased Smoke Vial from merchant",
    "Floor 5: Used Smoke Vial to escape Lich's gaze — victory"
  ],
  "inventory": ["Veil-Thread Bracers", "Smoke Vial", "Phantom Blade"]
}
```

`recapController.generate` calls `geminiService.callRecap`. The prompt instructs the Recap Agent:

- Write a 3–5 sentence second-person narrative referencing at least 2 `eventLog` events
- Assign a unique 2–5 word `runTitle` that reflects this specific run

Gemini returns:

```json
{
  "narrativeText": "You descended into the dungeon as a shadow, and emerged as its master. Where others would have charged the Silent Watcher, you read the wire, stepped over it, and let silence do your fighting. Floor after floor, you negotiated when diplomacy served, struck only when the moment was perfect, and when the Lich's gaze swept the final chamber, a Smoke Vial — purchased with the gold of a cautious survivor — bought you the breath you needed. The dungeon did not break you. You simply convinced it you were never there.",
  "runTitle": "The Unseen Rogue"
}
```

**Firestore writes executed by `recapController`:**

1. `players/{playerId}/recaps/{runId}` — narrative and title saved
2. `players/{playerId}` — profile updated:
   - `runsCompleted` incremented by `1`
   - `allTimeTitles` receives `arrayUnion("The Unseen Rogue")`
   - `bestDepth` updated to `5` if this exceeds the current value
   - `favoriteClass` updated to `"shadow_rogue"` if this class has the most runs

All four writes use `set({ merge: true })` so a partial network failure on any one write can be safely retried by the frontend without corrupting existing data.

---

## 11. Error Path — What Happens When Gemini Fails

Assume the Gemini API throws a `503` error during a `callDm` request on Floor 3. The throw propagates from `geminiService` back to `dmController.generate`:

```javascript
try {
  const encounter = await geminiService.callDm(params);
  await firestoreService.saveEncounter(runId, floorNumber, encounter);
  res.status(200).json({ success: true, data: { encounter } });
} catch (err) {
  next(err);
}
```

`next(err)` routes the error to `errorHandler.js`, which is registered as the last middleware in `index.js`. The handler:

1. Calls `console.error(err.message)` — logged to Firebase Functions console
2. Looks up `req.path` → `/api/v1/dm`
3. Returns:

```json
{
  "success": true,
  "data": {
    "encounter": {
      "encounterTitle": "The Dark Corridor",
      "narrativeText": "A goblin blocks your path, watching you with hungry eyes.",
      "enemyName": "Tunnel Goblin",
      "enemyType": "combat",
      "availableActions": ["Attack", "Negotiate", "Examine", "Flee"],
      "difficultyWeight": 2,
      "dmReasoning": "Fallback encounter triggered due to API error."
    }
  }
}
```

The frontend receives a valid encounter object. The DmThinkingPanel hides. The player sees a fully playable encounter. The app never shows a blank screen. The `dmReasoning` field explicitly communicates to the player (and to hackathon judges reviewing the in-app agent trace) that a fallback was triggered.

---

## 12. The Antigravity Trace — How Every Decision Becomes Visible

Every agent response contains a reasoning field (`dmReasoning`, `rivalReasoning`) that is persisted to Firestore. This creates three overlapping trace records:

| Layer | Where It Lives | Who Sees It |
|---|---|---|
| In-app DM Reasoning panel | EncounterScreen UI | Player in real-time |
| Firestore encounter document | `runs/{runId}/encounters/floor_n.dmReasoning` | Judges via Firestore Console |
| `workflow_log.md` | `.agent/workflow_log.md` | Judges via repo/Antigravity |

The `workflow_log.md` is appended after every workflow execution by Antigravity — not by the runtime Cloud Functions. It records the build-time decisions: why the prompt was structured a certain way, why a particular Firestore schema was chosen, and what the output of each agent build was. Combined with the runtime Firestore data, this constitutes the complete agentic audit trail required for hackathon submission.
