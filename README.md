# Realm Explorer — Agentic Dungeon Crawler

![Realm Explorer](https://via.placeholder.com/1200x400.png?text=Realm+Explorer+—+Agentic+Dungeon+Crawler)

Realm Explorer is a dynamic, short-session mobile roguelike RPG where every encounter, piece of dialogue, enemy behavior, and reward is generated in real-time by a suite of AI agents. No two runs are ever identical. Instead of traversing static dialogue trees, the player fights through an unpredictable fantasy dungeon guided by an AI Dungeon Master (DM) that adapts the world to their unique playstyle.

---

## 📑 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Agent Roles](#agent-roles)
3. [Comparative Baseline: Agentic vs. Fixed-Rule](#comparative-baseline-agentic-vs-fixed-rule)
4. [Handling the 5 Difficulty Metrics](#handling-the-5-difficulty-metrics)
5. [Integration Details](#integration-details)
6. [API Usage](#api-usage)

---

## 🏗️ Architecture Overview

The system is split into a highly responsive mobile frontend and a strictly controlled AI backend.

- **Frontend (Mobile Web / Android APK):** Built with React + TypeScript, Vite, and Capacitor. It uses Zustand for local state management (`gameStore`), presenting a clean, modern UI for the player.
- **Backend (Serverless AI Hub):** Hosted on Firebase Cloud Functions running an Express.js MVC framework. This ensures that all Gemini API calls, prompt building, and state validations happen securely server-side.
- **Database (Firestore):** All agent decisions, combat logs, encounters, and player profiles are logged in real-time to Firestore. This acts as both the source of truth for the player and a permanent audit trail (Agent Traces) for the AI.

---

## 🤖 Agent Roles

The intelligence of the system is distributed across four distinct AI Agents, each with a narrow, focused responsibility to prevent hallucination and maintain game balance.

1. **Dungeon Master (DM) Agent:** Responsible for the narrative setup. It reads the player's class, current HP, past action history, and derived playstyle to generate a contextual encounter (Enemy name, description, and available actions) along with a `difficultyWeight` (1-5).
2. **Rival Agent:** The combat and conflict resolution engine. It takes the player's natural language action and decides the outcome, calculating HP deltas for both the player and the enemy.
3. **Loot Agent:** Contextual reward generator. Instead of a random loot table, it generates items whose effects and flavor text match the narrative of the preceding encounter and the `winQuality` (e.g., a "messy" win might yield a chipped sword). Also acts as the Merchant on Floor 4.
4. **Recap Agent:** The bard of the system. Runs at the end of the game to synthesize the entire `eventLog` into a cohesive, entertaining narrative summary and updates the player's persistent profile.

---

## ⚖️ Comparative Baseline: Agentic vs. Fixed-Rule

A traditional **Fixed-Rule (Deterministic)** roguelike relies on pre-authored content:
- **Encounters:** Pulled from an array of static objects (e.g., `enemies = [{ name: 'Goblin', hp: 5, dmg: 2 }]`).
- **Player Actions:** Hardcoded buttons (Attack, Defend, Use Item) calculated via standard RNG math (`dmg = baseDmg - armor + Math.random()`).
- **Loot:** Selected via RNG from a static loot table database.

**Our Agentic Approach** fundamentally replaces these static databases with LLM-driven generation, grounded by structured JSON schemas:
- **Encounters:** The DM Agent *invents* enemies and scenarios on the fly based on what the player has been doing. If the player acts like a diplomat, they encounter more intelligent, negotiable adversaries.
- **Player Actions:** Players can attempt *anything* (e.g., "I throw sand in its eyes and sweep the legs"). The Rival Agent understands the semantic intent and calculates a logical consequence.
- **Loot:** Every item is bespoke, tying the game's economy directly into the emergent narrative. 

To prevent the common pitfall of "Agentic drift" (where the AI becomes too chaotic or unfair), we introduced the **Fairness Referee**—a fixed-rule middleware that sits *on top* of the Rival Agent to enforce boundaries.

---

## 📈 Handling the 5 Difficulty Metrics

To ensure the Agentic system remains balanced, playable, and challenging without feeling arbitrary, we implemented explicit handling for **5 Core Difficulty Metrics** across the prompt engineering and backend middleware:

1. **Playstyle Adaptation (Dynamic Routing)**
   *Implementation:* The DM Agent analyzes the `actionHistory` to derive a `playStyle` (Aggressive, Diplomatic, Cautious, Unpredictable). The prompt instructs the DM to spawn combat-heavy encounters for aggressive players, and trap/stealth encounters for cautious players.
2. **Mercy Thresholding (HP Scaling)**
   *Implementation:* If the player's `hp < maxHp * 0.3`, the DM Agent is mathematically forced via its prompt instructions to reduce the base `difficultyWeight` of the next encounter by 1, preventing unavoidable death spirals.
3. **Turn Escalation Penalty**
   *Implementation:* To prevent players from stalling encounters infinitely, the Rival Agent prompt includes an escalation rule: if `combatTurns > 3`, the enemy becomes significantly more aggressive and deals higher damage.
4. **First-Turn Fairness Clamping (Anti-One-Shot)**
   *Implementation:* Enforced by the `fairnessService`. If `combatTurns === 0`, the maximum `playerHpDelta` is clamped to `-3`, regardless of what the Rival Agent hallucinates. This guarantees players can never be one-shot at the start of a fight.
5. **Hard Resolution Cap (Deadlock Prevention)**
   *Implementation:* If an encounter drags on, the `fairnessService` overrides the Rival Agent. If `combatTurns > 6`, the system forces `combatOver = true` and `playerWon = false`, forcing a resolution and moving the game state forward.

---

## 🔌 Integration Details

- **Strict JSON Enforcement:** Gemini is prompted to return *only* valid JSON. The Express controllers parse this output immediately.
- **Middleware Validation:** All incoming requests from the client pass through a `validate` middleware. If an agent fails to respond or returns invalid JSON, an `errorHandler` injects a safe, fixed fallback response (e.g., "The Dark Corridor" encounter) so the game never crashes.
- **State Hydration:** The frontend `gameStore` acts as a dumb terminal. It only knows what the backend tells it. HP, floor progress, and gold are calculated server-side in the controllers and pushed to the client, preventing any client-side tampering.

---

## 🚀 API Usage

The backend exposes a clean `/api/v1` REST interface for the frontend to interact with.

- `POST /api/v1/run` - Initializes a new run in Firestore and returns a `runId`.
- `POST /api/v1/dm` - Triggers the DM Agent. Returns `{ encounter }`.
- `POST /api/v1/rival` - Submits a player action to the Rival Agent. Returns `{ combat }` and updates server-side HP.
- `POST /api/v1/loot` - Generates a reward. Pass `merchantMode: true` on Floor 4 for a 3-item selection.
- `POST /api/v1/recap` - Concludes the run, generates the story, and saves persistent profile stats.

---

## 🌍 Deployment & Hosting Architecture

Realm Explorer utilizes a robust, modern deployment pipeline targeting three distinct platforms to fulfill the hackathon's multi-platform requirements. The infrastructure relies heavily on the Google Firebase ecosystem for seamless, scalable delivery.

### 1. Web App Production Build (Firebase Hosting)
The browser-based version of Realm Explorer is hosted on **Firebase Hosting**, providing a globally distributed, low-latency Content Delivery Network (CDN). 
- **Build Pipeline:** The React frontend is bundled using Vite, applying aggressive minification, tree-shaking, and CSS extraction to guarantee a small footprint.
- **Deployment Mechanics:** The resulting static assets are deployed via the Firebase CLI. Firebase Hosting serves these assets over secure HTTPS with out-of-the-box SSL certificate provisioning and global edge caching, ensuring near-instant load times for users worldwide. Single Page Application (SPA) routing is natively handled by a specialized `firebase.json` rewrite rule.
- **Live Access:** You can experience the fully responsive web version here:  
  👉 **[Play Realm Explorer (Web App)](https://realm-explorer-514ba.web.app/)**

### 2. Native Android Application (Capacitor APK)
To deliver a premium, native mobile experience, the application is packaged as a standalone Android application (`.apk`).
- **Bridging Technology:** We leverage **Capacitor** (`@capacitor/android`) to bridge the web-to-native gap. Capacitor syncs the compiled Vite web assets directly into a native Android Studio project environment.
- **Native Compilation:** The project is compiled via Gradle into a highly optimized APK. This approach grants the application native rendering performance, fullscreen immersion, and hooks into native device APIs like the status bar and splash screen. 
- **Delivery:** This APK serves as our primary mobile submission, ensuring judges experience the game as a first-class mobile application.

### 3. Serverless AI API (Firebase Cloud Functions)
The entire intelligence layer is strictly decoupled from the client to ensure security, prevent API key leakage, and centralize the prompt engineering.
- **Architecture:** The backend is an Express.js MVC application deployed as a single, scalable Node.js microservice via **Firebase Cloud Functions**.
- **Execution:** When the client issues a REST request, Firebase automatically provisions isolated server environments to handle the Gemini API orchestration, validate the JSON responses, and commit game state to Firestore. This serverless paradigm ensures the backend scales instantly from zero to thousands of concurrent agent requests with zero server maintenance.

---
*Developed for the Google Antigravity Hackathon.*
