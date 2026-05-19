# Backend Implementation Plan
# Realm Explorer — Agentic Dungeon Crawler
### Node.js / Express · Firebase · Google Cloud · MVC Architecture

> **Target file path in repo:** `backend/docs/Backend_Implementation_Plan.md`

---

## 1. Architecture Overview

```
Client (React Native / Expo)
        │
        │  HTTP POST (JSON)
        ▼
Express Router  ──►  Controller  ──►  Service (Gemini / Firestore)
                                           │
                                           ▼
                                      Firebase Admin SDK
                                           │
                                           ▼
                                      Firestore (Game State)
```

The backend is a Node.js/Express application deployed as a single Firebase HTTPS Cloud Function. MVC layers:

- **Model** — Firestore document schemas enforced via factory functions in `models/`
- **View** — JSON response objects returned from every controller
- **Controller** — Express handlers that validate input, invoke services, return structured responses

---

## 2. Directory Scaffold

```
backend/
├── docs/
│   ├── Backend_Implementation_Plan.md
│   ├── Backend_Task_List.md
│   └── Backend_Walkthrough.md
└── logs/
    └── Agent_Traces.json

functions/
├── index.js
├── firebase-init.js
├── routes/
│   └── agentRoutes.js
├── controllers/
│   ├── dmController.js
│   ├── rivalController.js
│   ├── lootController.js
│   └── recapController.js
├── services/
│   ├── geminiService.js
│   ├── firestoreService.js
│   └── fairnessService.js
├── models/
│   ├── runModel.js
│   ├── encounterModel.js
│   ├── playerModel.js
│   └── itemModel.js
├── prompts/
│   ├── dm-prompt.js
│   ├── rival-prompt.js
│   ├── loot-prompt.js
│   └── recap-prompt.js
├── middleware/
│   ├── corsMiddleware.js
│   ├── validate.js
│   └── errorHandler.js
└── package.json
```

---

## 3. Phase 1 — Project Initialisation

### 3.1 Runtime & Dependencies

- Node.js engine: `20`
- Module system: CommonJS (`require` / `module.exports`) — no ES modules, no TypeScript

| Package | Version | Purpose |
|---|---|---|
| `firebase-functions` | `^4.0.0` | Cloud Function HTTP triggers |
| `firebase-admin` | `^12.0.0` | Firestore Admin SDK |
| `@google/generative-ai` | `^0.21.0` | Gemini 2.0 Flash |
| `express` | `^4.18.0` | HTTP routing |
| `cors` | `^2.8.5` | CORS headers |
| `uuid` | `^9.0.0` | Server-side ID generation |

### 3.2 Environment Variables

| Variable | Storage | Access Pattern |
|---|---|---|
| `GEMINI_API_KEY` | Firebase Functions config | `process.env.GEMINI_API_KEY` |
| `PROJECT_ID` | Auto-injected | `process.env.GCLOUD_PROJECT` |

Set key:
```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY"
```

---

## 4. Phase 2 — Firestore Schema (Models)

### 4.1 `players/{playerId}`

```
runsCompleted:    number
averageStyle:     string
favoriteClass:    string
bestDepth:        number
allTimeTitles:    string[]
unlockedClasses:  string[]
createdAt:        Timestamp
updatedAt:        Timestamp

  recaps/{runId}/
    narrativeText:  string
    runTitle:       string
    timestamp:      Timestamp
```

### 4.2 `runs/{runId}`

```
playerId:       string
playerClass:    string
hp:             number
maxHp:          number
gold:           number
currentFloor:   number
playStyle:      string
actionHistory:  string[]
eventLog:       string[]
inventory:      GameItem[]
status:         "active" | "completed" | "died"
startedAt:      Timestamp

  encounters/floor_1 ... floor_5/
    encounterTitle:    string
    narrativeText:     string
    enemyName:         string
    enemyType:         "combat" | "negotiation" | "hybrid"
    availableActions:  string[]
    difficultyWeight:  number
    dmReasoning:       string
    playerChoice:      string
    outcome:           "success" | "partial" | "failure"
    hpAfter:           number
    timestamp:         Timestamp

  combat/{combatId}/
    outcomeText:      string
    playerHpDelta:    number
    enemyHpDelta:     number
    combatOver:       boolean
    playerWon:        boolean
    winQuality:       "clean" | "close" | "messy"
    rivalReasoning:   string
    combatTurns:      number
    timestamp:        Timestamp

  loot/{lootId}/
    itemName:    string
    itemEffect:  string
    styleNote:   string
    flavorText:  string
    itemType:    "weapon" | "armor" | "ring" | "consumable"
    floor:       number
    timestamp:   Timestamp
```

---

## 5. Phase 3 — Firestore Security Rules

Copy verbatim to `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{playerId} {
      allow read: if request.auth != null && request.auth.uid == playerId;
      allow write: if request.auth != null && request.auth.uid == playerId;
      match /recaps/{runId} {
        allow read: if request.auth != null && request.auth.uid == playerId;
        allow write: if false;
      }
    }
    match /runs/{runId} {
      allow read: if request.auth != null && resource.data.playerId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.playerId == request.auth.uid;
      allow update, delete: if false;
      match /encounters/{floorId} { allow read: if request.auth != null; allow write: if false; }
      match /combat/{combatId}    { allow read: if request.auth != null; allow write: if false; }
      match /loot/{lootId}        { allow read: if request.auth != null; allow write: if false; }
    }
  }
}
```

---

## 6. Phase 4 — MVC Layer

### 6.1 Routes — `routes/agentRoutes.js`

| Method | Path | Controller |
|---|---|---|
| POST | `/api/v1/dm` | `dmController.generate` |
| POST | `/api/v1/rival` | `rivalController.resolve` |
| POST | `/api/v1/loot` | `lootController.generate` |
| POST | `/api/v1/recap` | `recapController.generate` |
| GET | `/api/v1/health` | inline `{ status: "ok" }` |

### 6.2 Controllers

Each controller:
1. Relies on `validate.js` middleware (reject early on missing fields)
2. Calls `geminiService` method with validated params
3. Passes rival output through `fairnessService.validate` (rival only)
4. Writes result to Firestore via `firestoreService`
5. Returns `res.status(200).json({ success: true, data: result })`
6. On thrown error → `errorHandler.js`

| Controller | Gemini Call | Firestore Write |
|---|---|---|
| `dmController` | `callDm` | `runs/{runId}/encounters/floor_{n}` |
| `rivalController` | `callRival` | `runs/{runId}/combat/{uuid}` |
| `lootController` | `callLoot` | `runs/{runId}/loot/{uuid}` |
| `recapController` | `callRecap` | `players/{id}/recaps/{runId}` + profile |

### 6.3 Services

**`geminiService.js`**
- Single `GoogleGenerativeAI` instance, model `gemini-2.0-flash`
- Strip fences before parse: `text.replace(/```json|```/g, '').trim()`
- Exports: `callDm`, `callRival`, `callLoot`, `callRecap`

**`firestoreService.js`**
- All writes: `set({ merge: true })` for idempotency
- Profile updates: `FieldValue.increment` and `FieldValue.arrayUnion`
- All docs: `timestamp: FieldValue.serverTimestamp()`
- Exports: `saveEncounter`, `saveCombat`, `saveLoot`, `saveRecap`, `updatePlayerProfile`, `createRun`

**`fairnessService.js`** — post-parse validation for Rival Agent only:

| Condition | Enforcement |
|---|---|
| `combatTurns === 0 && Math.abs(playerHpDelta) > 3` | Clamp `playerHpDelta = -3` |
| `combatTurns > 6` | Force `combatOver: true, playerWon: false` |
| Invalid `winQuality` | Recalculate from turns and HP ratio |

### 6.4 Models — factory functions

| File | Function | Output |
|---|---|---|
| `runModel.js` | `buildRun(params)` | `runs/{runId}` document |
| `encounterModel.js` | `buildEncounter(params)` | Encounter subdoc |
| `playerModel.js` | `buildPlayerUpdate(params)` | Profile update payload |
| `itemModel.js` | `buildItem(params)` | Loot subdoc |

### 6.5 Middleware

**`corsMiddleware.js`** — `Access-Control-Allow-Origin: *`, handles `OPTIONS` preflight with early `200`.

**`validate.js`** — Per-route required field arrays. Returns `400` on missing fields.

**`errorHandler.js`** — Global Express error handler. Route-keyed hardcoded fallbacks:

| Route | Fallback Payload |
|---|---|
| `/api/v1/dm` | `{ encounterTitle: "The Dark Corridor", narrativeText: "A goblin blocks your path.", enemyName: "Tunnel Goblin", enemyType: "combat", availableActions: ["Attack","Negotiate","Examine","Flee"], difficultyWeight: 2, dmReasoning: "Fallback encounter." }` |
| `/api/v1/rival` | `{ outcomeText: "The enemy stumbles back.", playerHpDelta: -1, enemyHpDelta: -2, combatOver: false, playerWon: false, winQuality: "messy", rivalReasoning: "Fallback combat." }` |
| `/api/v1/loot` | `{ itemName: "Worn Dagger", itemEffect: "+1 to next attack", styleNote: "A basic blade.", flavorText: "Its edge is dull.", itemType: "weapon" }` |
| `/api/v1/recap` | `{ narrativeText: "Your run ended in darkness.", runTitle: "The Unknown Wanderer" }` |

---

## 7. Phase 5 — Entry Point & Cloud Function Export

`functions/index.js` structure:
1. Initialise Express app
2. Register `corsMiddleware` and `express.json()` globally
3. Mount `agentRoutes` at root
4. Register `errorHandler` last
5. Export: `exports.api = functions.https.onRequest(app)`

Deployed URL:
```
https://us-central1-{PROJECT_ID}.cloudfunctions.net/api/v1/{agent}
```

---

## 8. Phase 6 — Deployment Pipeline

### Sequence

```bash
firebase login
firebase use --add
firebase functions:config:set gemini.key="KEY"
cd functions && npm install && cd ..
firebase deploy --only firestore:rules
firebase deploy --only functions:api
```

### Smoke Tests

```bash
curl -X POST https://us-central1-PROJECT_ID.cloudfunctions.net/api/v1/dm \
  -H "Content-Type: application/json" \
  -d '{"runId":"test1","playerId":"p1","floorNumber":1,"playerClass":"shadow_rogue","hp":9,"playStyle":"cautious","actionHistory":[],"eventLog":[]}'
```

### Monitoring

```bash
firebase functions:log --only api --follow
```

### Emulator (local testing)

```bash
firebase emulators:start --only functions,firestore
```

---

## 9. Antigravity Integration Points

| Workflow | Trigger | Endpoint | Firestore Side Effect |
|---|---|---|---|
| `build-dm-agent` | Floor load | `POST /api/v1/dm` | `encounters/floor_n` |
| `build-rival-agent` | Player action | `POST /api/v1/rival` | `combat/{id}` |
| `build-loot-agent` | Floor win | `POST /api/v1/loot` | `loot/{id}` |
| `build-loot-agent` (merchant) | Floor 4 load | `POST /api/v1/loot` (`merchantMode: true`) | 3x `loot` docs |
| `build-recap-agent` | Run end | `POST /api/v1/recap` | `recaps/{runId}` + player profile |

All workflow executions append structured entries to `.agent/workflow_log.md`.

---

## 10. Non-Functional Targets

| Requirement | Target | Mechanism |
|---|---|---|
| Response time | < 8 seconds | Gemini 2.0 Flash, no chained calls per request |
| Fallback | Always returns JSON | `errorHandler.js` fallback map |
| Idempotency | Safe on retry | `set({ merge: true })` on all writes |
| Security | No exposed keys | Functions config; `.gitignore` enforced |
| Agent trace | Per request | `dmReasoning` / `rivalReasoning` persisted to Firestore |
