# Frontend Implementation Plan
## Realm Explorer — Agentic Dungeon Crawler
### Google Antigravity Hackathon · Challenge 4: The Mobile App Alchemy

---

## 1. Overview

The frontend is a React Native (Expo) application written in JavaScript. It communicates with a Firebase Cloud Functions Express backend at `http://127.0.0.1:5001/demo-realm-explorer/us-central1/api/v1/` (emulator) or `https://us-central1-{PROJECT_ID}.cloudfunctions.net/api/v1/` (production) via HTTP POST requests. All runtime game state is managed in a Zustand global store. There is no direct Firestore SDK usage in the frontend — all persistence is handled server-side by the Cloud Functions before they return a response. The app is compiled to a native Android APK via Expo EAS Build for hackathon distribution.

---

## 2. Technology Stack

| Layer | Technology | Role |
|---|---|---|
| Framework | React Native + Expo | Mobile app runtime |
| Language | JavaScript (.js) | All frontend source files |
| Navigation | @react-navigation/stack | Screen-to-screen transitions |
| State | Zustand | Global game state, no prop drilling |
| API | fetch (native) | HTTP POST to Cloud Functions |
| Styling | StyleSheet.create() | All styling, no inline styles |
| Build | Expo EAS Build (preview profile) | Android APK output |

---

## 3. Design System

All components and screens adhere strictly to the following design tokens:

| Token | Value | Usage |
|---|---|---|
| bg-deep | `#1A1A2E` | Root screen background |
| bg-card | `#2A2A4E` | Cards, panels, top bars |
| accent | `#1D9E75` | Primary CTA buttons, player action text, player HP bar |
| danger | `#D85A30` | Enemy name, enemy HP bar, defeat button |
| text-primary | `#FFFFFF` | Headings, gold value, key data labels |
| text-secondary | `#B0B0C0` | Body narrative, labels, DM reasoning |
| border | `#3A3A6E` | Card borders, section dividers |
| muted | `#555555` | Disabled state, placeholder text |

---

## 4. Application Architecture

### 4.1 Navigation Stack

```
App.js
└── NavigationContainer
    └── Stack.Navigator
        ├── Screen "ClassSelect" → ClassSelectScreen.js
        ├── Screen "Encounter"   → EncounterScreen.js
        ├── Screen "Merchant"    → MerchantScreen.js
        └── Screen "Recap"       → RecapScreen.js
```

Navigation is strictly linear and follows the PRD core loop:

```
ClassSelect → Encounter (Floor 1–3) → [Floor 4: Merchant] → Encounter (Floor 5) → Recap → ClassSelect
```

### 4.2 Global State (Zustand — gameStore.js)

```
gameStore
├── run                  object | null   Active run data
│   ├── runId            string
│   ├── playerId         string
│   ├── playerClass      string
│   ├── hp               number
│   ├── maxHp            number
│   ├── gold             number
│   ├── currentFloor     number
│   ├── playStyle        string
│   ├── actionHistory    string[]
│   ├── eventLog         string[]
│   └── inventory        object[]
├── currentEncounter     object | null   Active floor encounter
│   ├── encounterTitle   string
│   ├── narrativeText    string
│   ├── enemyName        string
│   ├── enemyType        string
│   ├── availableActions string[]
│   ├── difficultyWeight number
│   └── dmReasoning      string
├── isThinking           boolean
└── thinkingMessage      string

Actions: setRun, setCurrentEncounter, setThinking, resetRun
```

### 4.3 API Service Layer (api.js)

`src/services/api.js` is the single source of truth for all backend communication.

| Export | Endpoint | Called By |
|---|---|---|
| `createRun(params)` | POST /v1/run | ClassSelectScreen on Start Run |
| `callDmAgent(params)` | POST /v1/dm | ClassSelectScreen after run creation |
| `callRivalAgent(params)` | POST /v1/rival | EncounterScreen on every player action |
| `callLootAgent(params)` | POST /v1/loot | MerchantScreen on mount |
| `callRecapAgent(params)` | POST /v1/recap | RecapScreen on mount |

---

## 5. Screen-by-Screen Implementation

### 5.1 ClassSelectScreen.js

Sequence on Start Run press:
1. `setThinking(true, 'Initializing run...')`
2. `POST /v1/run` — receive `{ runId, hp, maxHp, gold, currentFloor }`
3. `setRun({ ...runRes.data, playerClass: selectedClass })`
4. `setThinking(true, 'The DM is building the first floor...')`
5. `POST /v1/dm` — receive `{ data: { encounter } }`
6. `setCurrentEncounter(encounter)`
7. `setThinking(false)`
8. `navigation.navigate('Encounter')`

Local state: `selectedClass` (string)
Components: `DmThinkingPanel`, `ActionButton`

### 5.2 EncounterScreen.js

Core combat loop. Manages multi-turn combat via a scrolling in-screen combat log.

Local state:

| Name | Type | Purpose |
|---|---|---|
| `combatLog` | string[] | Scrolling narrative history |
| `combatState` | `{ over, won }` | Tracks combat conclusion |
| `localEnemyHp` | number | Enemy HP counter across turns |
| `currentTurn` | number | combatTurns sent to Rival Agent |

Sequence on action press:
1. `setThinking(true, 'The Rival is deciding your fate...')`
2. `POST /v1/rival` with `{ runId, enemyName, enemyType, enemyHp: localEnemyHp, playerAction: action, playerHp: run.hp, playerClass: run.playerClass, combatTurns: currentTurn, floorNumber: run.currentFloor }`
3. Receive `{ data: { combat, newHp, newEnemyHp, combatTurns } }`
4. `setRun({ ...run, hp: newHp })`
5. `setLocalEnemyHp(newEnemyHp)`
6. `setCurrentTurn(combatTurns)`
7. `setCombatLog(prev => [...prev, '> You: ' + action, combat.outcomeText])`
8. If `combat.combatOver`: `setCombatState({ over: true, won: combat.playerWon })`
9. `setThinking(false)`

Combat over routing:
- Player won → call `/v1/loot` → advance floor or navigate Merchant
- Player died → call `/v1/recap` → navigate Recap

Components: `StatBar` (×2), `DmThinkingPanel`, `ActionButton`, `ScrollView`

### 5.3 MerchantScreen.js

Floor 4 shop. Loot Agent in merchantMode returns 3 items.

Sequence on mount:
1. `setThinking(true, 'The merchant arranges their wares...')`
2. `POST /v1/loot` with `{ merchantMode: true, runId, playerId, playerClass, playStyle, floorNumber: 4, winQuality: 'clean', eventLog }`
3. Receive `{ data: { items: [item, item, item] } }`
4. Render 3 `ItemCard` components with buy/skip buttons

Components: `DmThinkingPanel`, `ItemCard`, `ActionButton`

### 5.4 RecapScreen.js

Post-run narrative. Recap Agent generates a personalised story and unique run title.

Sequence on mount:
1. `setThinking(true, 'The chronicler writes your story...')`
2. `POST /v1/recap` with full run payload
3. Receive `{ data: { recap: { narrativeText, runTitle } } }`
4. Typewriter character-reveal animation for `narrativeText`
5. Display `runTitle` badge in accent colour
6. Play Again → `resetRun()` → `navigation.navigate('ClassSelect')`

Components: `DmThinkingPanel`, `ActionButton`

---

## 6. Shared Components

### StatBar.js
- Props: `current` (number), `max` (number), `color` (hex string)
- Two nested Views, inner width = `(current / max) * 100 + '%'`
- Player: `#1D9E75`, Enemy: `#D85A30`

### DmThinkingPanel.js
- Props: `message` (string)
- Absolute-positioned full-screen overlay, `zIndex: 999`
- Pulsing dot via `Animated.loop` + `Animated.sequence`
- Shown whenever `isThinking === true` from Zustand

### ActionButton.js
- Props: `label` (string), `onPress` (function), `variant` ('primary' | 'secondary' | 'danger')
- primary: filled `#1D9E75`
- secondary: dark card `#2A2A4E` with `#1D9E75` border
- danger: filled `#D85A30`

### ItemCard.js
- Props: `item` ({ itemName, itemEffect, flavorText, styleNote, itemType })
- Dark card, item name in accent, type badge, effect + flavor rows

---

## 7. API Integration Pipeline

```
Screen
  │
  ├── setThinking(true, message)
  │
  ├── fetch(BASE_URL + endpoint, { method: 'POST', headers, body: JSON.stringify(params) })
  │
  ├── if (!res.ok) throw new Error(...)
  │
  ├── const data = await res.json()
  │
  ├── Update Zustand store (setRun / setCurrentEncounter)
  │
  ├── Update local state (combatLog, localEnemyHp, combatState)
  │
  └── setThinking(false)   [always in finally block]
```

Error handling: `try/catch/finally` on every API call. `finally` always calls `setThinking(false)`. `catch` appends a fallback message to the combat log. Backend guarantees hardcoded fallback JSON on any Gemini failure.

---

## 8. Deployment Pipeline

### Phase 1 — Backend to Google Cloud
```bash
firebase login
firebase use --add
firebase deploy --only functions
```
Update `BASE_URL` in `src/services/api.js` to the live Cloud Functions URL.

### Phase 2 — Android APK
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
EAS `preview` profile outputs a direct-install `.apk` file.

### Phase 3 — Web Fallback
```bash
npx expo export --platform web
firebase deploy --only hosting
```

---

## 9. File Map

```
realm-explorer/
├── App.js
├── src/
│   ├── screens/
│   │   ├── ClassSelectScreen.js
│   │   ├── EncounterScreen.js
│   │   ├── MerchantScreen.js
│   │   └── RecapScreen.js
│   ├── components/
│   │   ├── StatBar.js
│   │   ├── DmThinkingPanel.js
│   │   ├── ActionButton.js
│   │   └── ItemCard.js
│   ├── store/
│   │   └── gameStore.js
│   └── services/
│       └── api.js
└── frontend/
    ├── docs/
    │   ├── Frontend_Implementation_Plan.md
    │   ├── Frontend_Task_List.md
    │   └── Frontend_Walkthrough.md
    └── logs/
        └── Client_Data_Contracts.json
```
