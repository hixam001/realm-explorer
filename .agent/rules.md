# Realm Explorer — Antigravity Agent Rules

## Language Rules — STRICTLY ENFORCED
- Frontend (src/): TypeScript ONLY — .ts and .tsx files
- Backend (functions/): JavaScript ONLY — .js files, CommonJS syntax
- In functions/: use require() not import; use module.exports not export
- In functions/: NEVER create tsconfig.json or install TypeScript packages
- Never mix languages between frontend and backend directories

## MVC Structure (Backend)
- Entry: functions/index.js — Express app exported as single Cloud Function
- Routes: functions/routes/agentRoutes.js
- Controllers: functions/controllers/ — one file per agent + runController
- Services: functions/services/ — geminiService, firestoreService, fairnessService
- Models: functions/models/ — factory functions for Firestore documents
- Prompts: functions/prompts/ — one builder function per agent
- Middleware: functions/middleware/ — cors, validate, errorHandler

## Security
- Never hardcode API keys anywhere
- Gemini API key → Firebase Functions environment config only (process.env.GEMINI_API_KEY)
- Firebase client config → src/services/firebase.ts (non-secret)
- .env file → always in .gitignore

## Cloud Functions (JavaScript — CommonJS)
- All functions exported from functions/index.js as exports.api
- All functions must return JSON
- All functions must have try/catch with next(err) to errorHandler
- All functions must include CORS headers via corsMiddleware
- All functions must handle OPTIONS preflight
- All functions must write their output to Firestore before returning
- Gemini output must pass validateSchema() before being returned
- Player strings must pass sanitiseParams() before prompt injection

## Agentic Workflow Logging (MANDATORY)
- .agent/workflow_log.md must be updated after EVERY workflow execution
- Log format: Timestamp, Workflow Name, Trigger, Reasoning, Actions, Output, Status
- This file is a hackathon deliverable — treat it with the same importance as code

## API Endpoints (POST /api/v1/)
- /run    → create run, returns runId (MUST be called first)
- /dm     → generate encounter for current floor
- /rival  → resolve player action + Fairness Referee + update hp/floor/gold
- /loot   → item reward or merchant inventory (merchantMode: true)
- /recap  → write story, update player profile, close run

## Game State Flow
- Run starts: POST /run → creates runs/{runId} with status: active
- Each floor: POST /dm → writes encounters/floor_n
- Each action: POST /rival → writes combat/{id}, updates hp/currentFloor/gold
- Floor win: POST /loot → writes loot/{id}, appends to inventory
- Floor 4: POST /loot (merchantMode) → 3 items, player picks one
- Run end: POST /recap → writes recaps/{runId}, updates player profile, sets status: completed/died

## Fallback Map (errorHandler.js)
- /api/v1/dm     → The Dark Corridor fallback encounter
- /api/v1/rival  → safe messy combat result
- /api/v1/loot   → Worn Dagger
- /api/v1/recap  → generic narrative
