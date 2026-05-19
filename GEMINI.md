# Realm Explorer — Project Context

## What this project is
A mobile roguelike RPG where an AI Dungeon Master generates every encounter,
enemy, dialogue, and reward in real time based on player behaviour.
Built for the Google Antigravity Hackathon — Challenge 4: The Mobile App Alchemy.

## Tech stack
- Frontend: React Native + Expo (TypeScript — .tsx/.ts files only in src/)
- Backend: Firebase Cloud Functions (JavaScript ONLY — .js files, CommonJS require/module.exports)
- Database: Firebase Firestore
- AI: Gemini 2.0 Flash via @google/generative-ai
- State: Zustand (frontend only)
- Hosting: Firebase Hosting (web build via npx expo export --platform web)

## The four runtime agents (JavaScript Cloud Functions)
1. dmAgent      — generates each floor encounter based on player history
2. rivalAgent   — controls enemy behaviour and resolves combat
3. lootAgent    — generates contextual item rewards
4. recapAgent   — writes the end-of-run narrative story

## MVC Backend Structure
- Entry point: /functions/index.js (exports api = functions.https.onRequest(app))
- Routes: /functions/routes/agentRoutes.js
- Controllers: /functions/controllers/ (runController, dmController, rivalController, lootController, recapController)
- Services: /functions/services/ (geminiService, firestoreService, fairnessService)
- Models: /functions/models/ (runModel, encounterModel, playerModel, itemModel)
- Prompts: /functions/prompts/ (dm-prompt, rival-prompt, loot-prompt, recap-prompt)
- Middleware: /functions/middleware/ (corsMiddleware, validate, errorHandler)

## API endpoints (all under /api/v1/)
- POST /run      — create new run, returns runId
- POST /dm       — generate floor encounter
- POST /rival    — resolve player action (includes Fairness Referee)
- POST /loot     — generate item reward (or merchantMode: true for 3 items)
- POST /recap    — write end-of-run story, update player profile
- GET  /health   — health check

## Key rules
- functions/ is JavaScript ONLY. No .ts files, no tsconfig.json, use require() not import
- src/ is TypeScript ONLY. No .js files.
- All Gemini API calls happen inside Cloud Functions, never in the app
- All game state must be saved to Firestore before a function returns
- All functions must return JSON and include a hardcoded fallback on error
- Gemini output is schema-validated before being returned (geminiService.validateSchema)
- Player-controlled strings are sanitised before prompt injection (geminiService.sanitiseParams)

## Firestore collections
- players/{playerId} — profile, runsCompleted, bestDepth, allTimeTitles
- players/{playerId}/recaps/{runId} — narrativeText, runTitle
- runs/{runId} — full run state including hp, currentFloor, status, gold
- runs/{runId}/encounters/floor_1..5 — DM output + playerChoice + outcome
- runs/{runId}/combat/{id} — rival output + fairness-validated deltas
- runs/{runId}/loot/{id} — item rewards

## File locations
- Cloud Functions: /functions/controllers/ (.js files)
- Gemini prompts: /functions/prompts/ (.js module.exports)
- React Native screens: /src/screens/ (.tsx files)
- Global state: /src/store/gameStore.ts (Zustand)
- All Cloud Function HTTP calls: /src/services/api.ts
- Agent workflow log: /.agent/workflow_log.md (append after every workflow)
