# Frontend Technical Walkthrough
## Realm Explorer — Agentic Dungeon Crawler
### Google Antigravity Hackathon · Challenge 4: The Mobile App Alchemy

---

## Overview

This walkthrough traces the exact lifecycle of a single complete game turn in Realm Explorer — from the moment a player taps a combat action on their phone screen, through the telemetry capture and packaging, across the HTTP wire to the Firebase Cloud Functions backend, through the Gemini-powered Rival Agent, and back to the UI re-render. It covers every layer of the stack that is under frontend responsibility.

---

## Part 1 — Application Bootstrap

When the user opens the app, React Navigation's `NavigationContainer` initialises and renders the `ClassSelectScreen` as the root screen. The Zustand `gameStore` initialises with all values at `null` or their defaults:

```
run:               null
currentEncounter:  null
isThinking:        false
thinkingMessage:   ''
```

The `DmThinkingPanel` component, which is conditionally rendered on every screen with `{isThinking && <DmThinkingPanel message={thinkingMessage} />}`, begins in a hidden state.

---

## Part 2 — Run Initialisation (ClassSelectScreen)

### 2.1 Class Selection

The player views three class cards rendered from a static `CLASSES` array:

```
CLASSES = [
  { id: 'blade_dancer', name: 'Blade Dancer', icon: '⚔️' },
  { id: 'ember_mage',   name: 'Ember Mage',   icon: '🔥' },
  { id: 'shadow_rogue', name: 'Shadow Rogue', icon: '🗡️' }
]
```

A `useState('blade_dancer')` hook tracks the selected class. Tapping a card calls `setSelectedClass(cls.id)`, which re-renders the card with a highlighted border (`#1D9E75`). No backend call occurs during selection.

### 2.2 Start Run — First Agent Call Sequence

When the player presses "Start Run", the `handleStart` async function executes:

**Step 1 — Show DM Thinking Overlay**

```javascript
setThinking(true, 'Initializing run...');
```

This sets `isThinking: true` in Zustand. Every screen checks this value on every render. The `DmThinkingPanel` immediately becomes visible with the message "Initializing run..." and its animated pulsing dot begins cycling.

**Step 2 — POST /v1/run (Create Run)**

```javascript
const runRes = await createRun({
  playerId: 'test_player_01',
  playerClass: selectedClass,
  playStyle: 'balanced'
});
```

The `createRun` function in `api.js` issues:

```
POST http://[BASE_URL]/v1/run
Content-Type: application/json

{ "playerId": "test_player_01", "playerClass": "blade_dancer", "playStyle": "balanced" }
```

The `runController.js` on the backend creates a Firestore document at `runs/{runId}` and returns:

```json
{
  "success": true,
  "data": {
    "runId": "abc123",
    "hp": 10,
    "maxHp": 10,
    "gold": 0,
    "currentFloor": 1,
    "status": "active"
  }
}
```

The frontend then commits this to the Zustand store:

```javascript
setRun({ ...runRes.data, playerClass: selectedClass });
```

**Step 3 — POST /v1/dm (Generate Floor 1 Encounter)**

```javascript
setThinking(true, 'The DM is building the first floor...');
const dmRes = await callDmAgent({
  runId: runRes.data.runId,
  playerId: 'test_player_01',
  floorNumber: 1,
  playerClass: selectedClass,
  hp: runRes.data.hp,
  maxHp: runRes.data.maxHp,
  playStyle: 'balanced',
  actionHistory: [],
  eventLog: []
});
setCurrentEncounter(dmRes.data.encounter);
```

The DM Agent prompt instructs Gemini 2.0 Flash to generate a unique encounter. The backend validates the schema and saves it to `runs/{runId}/encounters/floor_1` before returning:

```json
{
  "success": true,
  "data": {
    "encounter": {
      "encounterTitle": "The Iron Gate",
      "narrativeText": "A massive stone construct blocks your descent. Its single eye pulses red.",
      "enemyName": "Golem Sentinel",
      "enemyType": "combat",
      "availableActions": ["Strike the eye", "Seek a weakness", "Taunt it", "Retreat"],
      "difficultyWeight": 3,
      "dmReasoning": "Player is on Floor 1 with full HP and aggressive class. Introduced a high-HP combat enemy to establish challenge tone."
    }
  }
}
```

**Step 4 — Navigate to Encounter**

```javascript
navigation.navigate('Encounter');
```

Navigation only fires after both API calls have resolved. The screen the player arrives at is fully populated with live AI-generated content.

---

## Part 3 — Combat Loop (EncounterScreen)

### 3.1 Initial Render State

When `EncounterScreen` mounts, it reads all necessary data from the Zustand store:

```javascript
const { currentEncounter, run, isThinking, thinkingMessage, setThinking, setRun } = useGameStore();
```

Local component state is initialised:

```javascript
const [combatLog, setCombatLog] = useState([currentEncounter?.narrativeText ?? '']);
const [combatState, setCombatState] = useState({ over: false, won: false });
const [localEnemyHp, setLocalEnemyHp] = useState(10);
const [currentTurn, setCurrentTurn] = useState(0);
```

The `combatLog` array is seeded with the DM's opening narrative text. The screen renders:
- Top bar: player `StatBar` (green, reads `run.hp / run.maxHp`) and gold value
- Enemy card: enemy name and enemy `StatBar` (red, reads `localEnemyHp / 10`)
- Narrative box: `ScrollView` rendering each entry in `combatLog`
- Action buttons: mapped from `currentEncounter.availableActions`
- DM Reasoning tab: collapsible `TouchableOpacity` at the bottom, displays `currentEncounter.dmReasoning`

### 3.2 Telemetry Capture — Player Action Press

When the player taps an action button (e.g., "Strike the eye"), the `ActionButton` calls:

```javascript
onPress={() => handleAction(action)}
```

The string `"Strike the eye"` is the telemetry payload unit. It is captured directly from the AI-generated `availableActions` array, ensuring the backend always receives actions that match the context it generated.

### 3.3 Rival Agent API Call — Packaging the Telemetry

```javascript
const handleAction = async (action) => {
  setThinking(true, 'The Rival is deciding your fate...');
  try {
    const res = await callRivalAgent({
      runId:       run.runId,
      enemyName:   currentEncounter.enemyName,
      enemyType:   currentEncounter.enemyType,
      enemyHp:     localEnemyHp,
      playerAction: action,
      playerHp:    run.hp,
      playerClass: run.playerClass,
      combatTurns: currentTurn,
      floorNumber: run.currentFloor || 1
    });
```

The complete telemetry payload sent to `POST /v1/rival`:

```json
{
  "runId":        "abc123",
  "enemyName":    "Golem Sentinel",
  "enemyType":    "combat",
  "enemyHp":      10,
  "playerAction": "Strike the eye",
  "playerHp":     10,
  "playerClass":  "blade_dancer",
  "combatTurns":  0,
  "floorNumber":  1
}
```

### 3.4 Backend Processing Chain

On receiving this payload, the backend executes in sequence:

1. `validate` middleware confirms all required fields are present. Missing `floorNumber` returns HTTP 400 immediately.
2. `rivalController.resolve` extracts params and calls `geminiService.callRival(params)`.
3. `geminiService` builds the prompt via `buildRivalPrompt(params)`, calls Gemini 2.0 Flash with retry logic (3 attempts, 5s delay on 503), parses the JSON response, and validates the schema against `REQUIRED_FIELDS.rival`.
4. `fairnessService.validate(rawResult, combatTurns, playerHp)` enforces fairness rules:
   - If `combatTurns === 0` and `|playerHpDelta| > 3`: clamp `playerHpDelta = -3`
   - If `combatTurns > 6`: force `combatOver: true, playerWon: false`
5. `firestoreService.saveCombat(runId, combat)` writes the combat result to Firestore.
6. `firestoreService.updateRunAfterCombat(runId, newHp, ...)` updates the run document.
7. Response returned to frontend:

```json
{
  "success": true,
  "data": {
    "combat": {
      "outcomeText":     "Your blade finds the glowing eye socket. The Golem reels back, its movements stuttering.",
      "playerHpDelta":   -2,
      "enemyHpDelta":    -4,
      "combatOver":      false,
      "playerWon":       false,
      "winQuality":      "clean",
      "rivalReasoning":  "Blade Dancer's precision attack hit a critical weakness. Rewarding the aggressive approach."
    },
    "newHp":        8,
    "newEnemyHp":   6,
    "combatTurns":  1
  }
}
```

### 3.5 UI Re-render — Dynamic State Update

On receiving the backend response, the frontend updates state in sequence:

```javascript
const newEnemyHp = res.data.newEnemyHp;
const combat = res.data.combat;

setRun({ ...run, hp: res.data.newHp });
setLocalEnemyHp(newEnemyHp);
setCurrentTurn(res.data.combatTurns);

setCombatLog(prev => [
  ...prev,
  '> You: Strike the eye',
  combat.outcomeText
]);

if (combat.combatOver) {
  setCombatState({ over: true, won: combat.playerWon });
}
```

React's reconciliation engine triggers a targeted re-render of:
- The player `StatBar` — its `current` prop changes from 10 to 8, the filled bar animates narrower
- The enemy `StatBar` — its `current` prop changes from 10 to 6, the red bar shrinks
- The `combatLog` `ScrollView` — two new entries are appended: the player's action in `#1D9E75` and the AI's outcome narrative in `#B0B0C0`

The action buttons remain visible for the next player choice. No screen navigation occurs; the entire encounter unfolds within the single `EncounterScreen` component.

### 3.6 Combat Resolution Routing

On each turn, `combat.combatOver` is checked. When `true`:
- Action buttons are replaced by a single terminal button:
  - `playerWon === true` → "Claim Victory" button (primary variant, `#1D9E75`)
  - `playerWon === false` → "Accept Defeat" button (danger variant, `#D85A30`)
- Pressing either button triggers the post-combat routing:
  - Victory → call `/v1/loot` → if `currentFloor === 4` navigate Merchant, else call `/v1/dm` for next floor and stay on EncounterScreen with reset local state
  - Defeat → call `/v1/recap` → navigate RecapScreen

---

## Part 4 — Recap Narrative (RecapScreen)

When the player dies or completes all 5 floors, `RecapScreen` mounts and immediately calls:

```javascript
const res = await callRecapAgent({
  runId:           run.runId,
  playerId:        'test_player_01',
  playerClass:     run.playerClass,
  finalHp:         run.hp,
  floorsCompleted: run.currentFloor,
  died:            !playerWon,
  gold:            run.gold,
  playStyle:       run.playStyle,
  eventLog:        run.eventLog,
  inventory:       run.inventory.map(i => i.itemName)
});
```

The Recap Agent sends the entire event log to Gemini, which produces a personalised 3–5 sentence story referencing at least 2 specific events. The response:

```json
{
  "success": true,
  "data": {
    "recap": {
      "narrativeText": "You descended as a Blade Dancer, your edge hungry for the dark. The Golem Sentinel taught you that not every eye blinks twice. On the second floor, the Shadow Broker offered gold for information you refused to sell — a choice the dungeon noted. Your story ends here, but the dungeon remembers your name.",
      "runTitle": "The Principled Dancer"
    }
  }
}
```

The `narrativeText` is displayed using a character-reveal typewriter animation. The `runTitle` is displayed in a badge component styled with the accent colour `#1D9E75`. Pressing "Play Again" calls `resetRun()` on the Zustand store, zeroing all run state, and navigates back to `ClassSelectScreen`.

---

## Part 5 — The DM Reasoning Panel (Agent Trace as Game Mechanic)

The `dmReasoning` field returned by the DM Agent is rendered in a collapsible panel anchored to the bottom of `EncounterScreen`. This is the hackathon's "Agent Trace" requirement made into a game feature:

```javascript
<TouchableOpacity
  style={styles.dmReasoningTab}
  onPress={() => setShowReasoning(!showReasoning)}
>
  <Text style={styles.dmTabTitle}>DM REASONING</Text>
  {showReasoning && (
    <Text style={styles.dmReasoningText}>{dmReasoning}</Text>
  )}
</TouchableOpacity>
```

The panel is always present at the bottom of the screen. Tapping it expands to reveal the AI's plain-English explanation of why it generated the current encounter, making the agent's reasoning directly visible to the player as a transparency mechanic.
