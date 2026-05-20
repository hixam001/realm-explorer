# Frontend Task List
## Realm Explorer — Agentic Dungeon Crawler
### Google Antigravity Hackathon · Challenge 4: The Mobile App Alchemy

---

## Sprint 0 — Project Bootstrap

| ID | Task | File | Status |
|---|---|---|---|
| F-00 | Initialise Expo project with blank JS template | `package.json`, `App.js` | ✅ Done |
| F-01 | Install @react-navigation/native + @react-navigation/stack | `package.json` | ✅ Done |
| F-02 | Install zustand | `package.json` | ✅ Done |
| F-03 | Wire NavigationContainer + Stack.Navigator in App.js | `App.js` | ✅ Done |
| F-04 | Register all screen routes in App.js | `App.js` | ✅ Done |
| F-05 | Fix package.json main entry point to `expo/AppEntry.js` | `package.json` | ✅ Done |

---

## Sprint 1 — Global State

| ID | Task | File | Status |
|---|---|---|---|
| F-10 | Create Zustand store with `run`, `currentEncounter`, `isThinking`, `thinkingMessage` | `src/store/gameStore.js` | ✅ Done |
| F-11 | Implement `setRun(runData)` action | `src/store/gameStore.js` | ✅ Done |
| F-12 | Implement `setCurrentEncounter(encounter)` action | `src/store/gameStore.js` | ✅ Done |
| F-13 | Implement `setThinking(bool, message)` action | `src/store/gameStore.js` | ✅ Done |
| F-14 | Implement `resetRun()` action for Play Again flow | `src/store/gameStore.js` | ✅ Done |

---

## Sprint 2 — API Service Layer

| ID | Task | File | Status |
|---|---|---|---|
| F-20 | Define `BASE_URL` constant pointing to local emulator | `src/services/api.js` | ✅ Done |
| F-21 | Implement `createRun(params)` — POST /v1/run | `src/services/api.js` | ✅ Done |
| F-22 | Implement `callDmAgent(params)` — POST /v1/dm | `src/services/api.js` | ✅ Done |
| F-23 | Implement `callRivalAgent(params)` — POST /v1/rival | `src/services/api.js` | ✅ Done |
| F-24 | Implement `callLootAgent(params)` — POST /v1/loot | `src/services/api.js` | ✅ Done |
| F-25 | Implement `callRecapAgent(params)` — POST /v1/recap | `src/services/api.js` | ✅ Done |
| F-26 | Add throw on non-OK HTTP responses in all api functions | `src/services/api.js` | ✅ Done |
| F-27 | Update `BASE_URL` to live Cloud Functions URL post-deploy | `src/services/api.js` | ⬜ Pending deploy |

---

## Sprint 3 — Shared Components

| ID | Task | File | Status |
|---|---|---|---|
| F-30 | Create `StatBar` component — dual-view HP progress bar | `src/components/StatBar.js` | ✅ Done |
| F-31 | Wire StatBar `color` prop for player (`#1D9E75`) vs enemy (`#D85A30`) | `src/components/StatBar.js` | ✅ Done |
| F-32 | Create `DmThinkingPanel` component — full-screen overlay | `src/components/DmThinkingPanel.js` | ✅ Done |
| F-33 | Add `Animated.loop` pulsing dot to DmThinkingPanel | `src/components/DmThinkingPanel.js` | ✅ Done |
| F-34 | Create `ActionButton` component with primary/secondary/danger variants | `src/components/ActionButton.js` | ✅ Done |
| F-35 | Create `ItemCard` component for loot item display | `src/components/ItemCard.js` | ⬜ Pending |

---

## Sprint 4 — ClassSelectScreen

| ID | Task | File | Status |
|---|---|---|---|
| F-40 | Render 3 class cards (Blade Dancer, Ember Mage, Shadow Rogue) with icon and desc | `src/screens/ClassSelectScreen.js` | ✅ Done |
| F-41 | Implement selectedClass local state with visual highlight on selected card | `src/screens/ClassSelectScreen.js` | ✅ Done |
| F-42 | Wire Start Run button to `handleStart` async handler | `src/screens/ClassSelectScreen.js` | ✅ Done |
| F-43 | Call `createRun` → receive runId, hp, maxHp, gold, currentFloor | `src/screens/ClassSelectScreen.js` | ✅ Done |
| F-44 | Call `callDmAgent` → receive encounter object | `src/screens/ClassSelectScreen.js` | ✅ Done |
| F-45 | Set Zustand `run` and `currentEncounter` after both calls | `src/screens/ClassSelectScreen.js` | ✅ Done |
| F-46 | Navigate to Encounter only after DM response is received | `src/screens/ClassSelectScreen.js` | ✅ Done |
| F-47 | Show `DmThinkingPanel` with contextual messages during both API calls | `src/screens/ClassSelectScreen.js` | ✅ Done |
| F-48 | Add `try/catch/finally` with `setThinking(false)` in finally | `src/screens/ClassSelectScreen.js` | ✅ Done |

---

## Sprint 5 — EncounterScreen

| ID | Task | File | Status |
|---|---|---|---|
| F-50 | Render top bar with player HP `StatBar` and gold value | `src/screens/EncounterScreen.js` | ✅ Done |
| F-51 | Render enemy card with enemy name and enemy HP `StatBar` | `src/screens/EncounterScreen.js` | ✅ Done |
| F-52 | Initialise `combatLog` state with `currentEncounter.narrativeText` | `src/screens/EncounterScreen.js` | ✅ Done |
| F-53 | Render `combatLog` entries in `ScrollView` — player actions in accent colour | `src/screens/EncounterScreen.js` | ✅ Done |
| F-54 | Render action buttons from `currentEncounter.availableActions` | `src/screens/EncounterScreen.js` | ✅ Done |
| F-55 | Call `callRivalAgent` on action press with full combat context payload | `src/screens/EncounterScreen.js` | ✅ Done |
| F-56 | Append player action and `combat.outcomeText` to `combatLog` after rival response | `src/screens/EncounterScreen.js` | ✅ Done |
| F-57 | Update `setRun({ ...run, hp: newHp })` to animate player StatBar | `src/screens/EncounterScreen.js` | ✅ Done |
| F-58 | Update `localEnemyHp` to animate enemy StatBar | `src/screens/EncounterScreen.js` | ✅ Done |
| F-59 | Track `currentTurn` (combatTurns) across turns | `src/screens/EncounterScreen.js` | ✅ Done |
| F-60 | Detect `combat.combatOver` and switch to Claim Victory / Accept Defeat button | `src/screens/EncounterScreen.js` | ✅ Done |
| F-61 | Implement DM Reasoning collapsible panel at bottom of screen | `src/screens/EncounterScreen.js` | ✅ Done |
| F-62 | Route Claim Victory → call lootAgent → advance floor or navigate Merchant | `src/screens/EncounterScreen.js` | ⬜ Pending |
| F-63 | Route Accept Defeat (player death) → call recapAgent → navigate Recap | `src/screens/EncounterScreen.js` | ⬜ Pending |
| F-64 | On floor advance, reset `combatLog`, `combatState`, `localEnemyHp`, `currentTurn` and call DM Agent for next floor | `src/screens/EncounterScreen.js` | ⬜ Pending |

---

## Sprint 6 — MerchantScreen

| ID | Task | File | Status |
|---|---|---|---|
| F-70 | Create MerchantScreen scaffold with SafeAreaView and DmThinkingPanel | `src/screens/MerchantScreen.js` | ⬜ Pending |
| F-71 | Call `callLootAgent` with `merchantMode: true` on screen mount | `src/screens/MerchantScreen.js` | ⬜ Pending |
| F-72 | Render 3 `ItemCard` components from API response | `src/screens/MerchantScreen.js` | ⬜ Pending |
| F-73 | Implement Buy button — deduct gold from `run.gold`, add item to `run.inventory` | `src/screens/MerchantScreen.js` | ⬜ Pending |
| F-74 | Implement Skip / Continue button — navigate to Encounter Screen (Floor 5) | `src/screens/MerchantScreen.js` | ⬜ Pending |

---

## Sprint 7 — RecapScreen

| ID | Task | File | Status |
|---|---|---|---|
| F-80 | Create RecapScreen scaffold with SafeAreaView and DmThinkingPanel | `src/screens/RecapScreen.js` | ⬜ Pending |
| F-81 | Call `callRecapAgent` with full run payload on screen mount | `src/screens/RecapScreen.js` | ⬜ Pending |
| F-82 | Implement typewriter character-reveal animation for `narrativeText` | `src/screens/RecapScreen.js` | ⬜ Pending |
| F-83 | Display `runTitle` in accent-coloured badge | `src/screens/RecapScreen.js` | ⬜ Pending |
| F-84 | Display final stats: floors completed, gold, HP remaining | `src/screens/RecapScreen.js` | ⬜ Pending |
| F-85 | Wire Play Again button → `resetRun()` → navigate ClassSelect | `src/screens/RecapScreen.js` | ⬜ Pending |

---

## Sprint 8 — Telemetry Capture

| ID | Task | File | Status |
|---|---|---|---|
| F-90 | Capture `playerAction` string from every action button press | `src/screens/EncounterScreen.js` | ✅ Done |
| F-91 | Append action to local `actionHistory` array before API call | `src/screens/EncounterScreen.js` | ⬜ Pending |
| F-92 | Append outcome event string to local `eventLog` array after rival response | `src/screens/EncounterScreen.js` | ⬜ Pending |
| F-93 | Pass updated `actionHistory` and `eventLog` in `callDmAgent` payload for next floor | `src/screens/EncounterScreen.js` | ⬜ Pending |
| F-94 | Pass full `eventLog` in `callRecapAgent` payload for narrative personalisation | `src/screens/RecapScreen.js` | ⬜ Pending |
| F-95 | Pass full `inventory` array in `callRecapAgent` payload | `src/screens/RecapScreen.js` | ⬜ Pending |

---

## Sprint 9 — Polish

| ID | Task | File | Status |
|---|---|---|---|
| F-100 | Add `Animated.spring` press feedback to all ActionButtons | `src/components/ActionButton.js` | ⬜ Pending |
| F-101 | Animate HP StatBar width change using `Animated.timing` | `src/components/StatBar.js` | ⬜ Pending |
| F-102 | Add error state retry button to EncounterScreen catch block | `src/screens/EncounterScreen.js` | ⬜ Pending |
| F-103 | Test DmThinkingPanel overlay renders correctly on device viewport | All screens | ⬜ Pending |
| F-104 | Verify combat log ScrollView auto-scrolls to bottom on new entry | `src/screens/EncounterScreen.js` | ⬜ Pending |

---

## Sprint 10 — Deployment

| ID | Task | File | Status |
|---|---|---|---|
| F-110 | Run `firebase deploy --only functions` and confirm live URLs | Cloud terminal | ⬜ Pending |
| F-111 | Update `BASE_URL` in api.js to production Cloud Functions URL | `src/services/api.js` | ⬜ Pending |
| F-112 | Run `eas build -p android --profile preview` | Terminal | ⬜ Pending |
| F-113 | Download APK from EAS and install on physical Android device | Device | ⬜ Pending |
| F-114 | Complete end-to-end test on device: class select → combat → recap | Device | ⬜ Pending |
| F-115 | Record 3-minute demo video | Device screen capture | ⬜ Pending |
