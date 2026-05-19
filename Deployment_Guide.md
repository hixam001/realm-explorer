# Deployment & Hosting Guide
# Realm Explorer — Google Antigravity Hackathon
### Step-by-step guide: Cloud Functions · Firebase Hosting · Android APK · Judge Distribution

---

## Overview

Realm Explorer has three deployment targets, each serving a different purpose for the hackathon submission:

| Target | Method | Purpose | Deliverable |
|---|---|---|---|
| Cloud Functions | Firebase CLI | Powers all 4 AI agents server-side | Required for all targets |
| Web App | Firebase Hosting | URL for submission form, browser playable | Web App (Optional) |
| Android APK | Expo EAS Build + Firebase App Distribution | Mobile app for judges to install | **Mobile App (MUST)** |

**Recommended submission order:** Deploy Cloud Functions first → Web build second → APK third. The APK build takes the longest (~10–15 min in cloud) so start it early and do other tasks while it runs.

---

## Prerequisites Checklist

Complete these before starting any deployment step.

- [ ] Node.js 20 or later installed (`node --version`)
- [ ] Firebase CLI installed globally (`npm install -g firebase-tools`)
- [ ] Expo CLI and EAS CLI installed (`npm install -g expo-cli eas-cli`)
- [ ] Firebase project created at [console.firebase.google.com](https://console.firebase.google.com) with these services enabled:
  - Firestore (in production mode)
  - Cloud Functions (requires Blaze plan — pay-as-you-go, free tier is sufficient for hackathon)
  - Firebase Hosting
  - Firebase App Distribution
- [ ] Gemini API key obtained from [Google AI Studio](https://aistudio.google.com)
- [ ] Expo account created at [expo.dev](https://expo.dev)
- [ ] Firebase Android App registered in your Firebase project (needed for App Distribution)
- [ ] Confirmed that `functions/` directory contains **only `.js` files** — no `.ts` files, no `tsconfig.json`

---

## Part 1: Deploy Cloud Functions to Firebase

The Cloud Functions are the JavaScript backend that powers all four AI agents. This must be deployed before you can run the app in any form.

### Step 1.1 — Login to Firebase

```bash
firebase login
```

Follow the browser authentication flow. Confirm you are logged into the correct Google account that owns your Firebase project.

### Step 1.2 — Set the active Firebase project

```bash
firebase use --add
```

Select your project from the list. When asked for an alias, type `default`. This sets the project as your default for all subsequent Firebase commands in this directory.

Verify it worked:
```bash
firebase projects:list
```

You should see your project listed with an asterisk (*) next to it.

### Step 1.3 — Set the Gemini API key in Firebase config

This is the only secure way to make the API key available to your Cloud Functions. Never put it in any file that is committed to your repository.

```bash
firebase functions:config:set gemini.key="YOUR_GEMINI_API_KEY_HERE"
```

Verify it was saved:
```bash
firebase functions:config:get
```

You should see:
```json
{
  "gemini": {
    "key": "YOUR_GEMINI_API_KEY_HERE"
  }
}
```

In your JavaScript Cloud Functions, access it as:
```javascript
// In each agent .js file — access via process.env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

> **Note:** If using Firebase Functions v2, use `defineSecret` or set environment variables via the Firebase console under Functions → Configuration.

### Step 1.4 — Verify functions directory is JavaScript only

Before deploying, confirm:
```bash
ls functions/          # Should show: index.js, firebase-init.js, package.json, agents/, prompts/
ls functions/agents/   # Should show: dm-agent.js, rival-agent.js, loot-agent.js, recap-agent.js
ls functions/prompts/  # Should show: dm-prompt.js, rival-prompt.js, loot-prompt.js, recap-prompt.js
```

If you see any `.ts` files or a `tsconfig.json` in the functions directory, delete them before proceeding.

### Step 1.5 — Install functions dependencies

```bash
cd functions
npm install
cd ..
```

### Step 1.6 — Deploy all Cloud Functions

```bash
firebase deploy --only functions
```

This uploads all four JavaScript Cloud Functions (dmAgent, rivalAgent, lootAgent, recapAgent). The first deploy takes 3–5 minutes.

On success, you will see:
```
✔  functions[dmAgent(us-central1)]: Successful create operation.
✔  functions[rivalAgent(us-central1)]: Successful create operation.
✔  functions[lootAgent(us-central1)]: Successful create operation.
✔  functions[recapAgent(us-central1)]: Successful create operation.
```

Note the function URLs printed in the output:
```
https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/dmAgent
```

Copy these URLs into `src/services/api.ts` as the `BASE_URL`.

### Step 1.7 — Test each Cloud Function with curl

Run each test in sequence and confirm you get a valid JSON response before proceeding.

**Test dmAgent:**
```bash
curl -X POST https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/dmAgent \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "test-run-001",
    "playerId": "test-player-001",
    "floorNumber": 1,
    "playerClass": "shadow_rogue",
    "hp": 9,
    "playStyle": "cautious",
    "actionHistory": [],
    "eventLog": []
  }'
```

**Expected response structure:**
```json
{
  "success": true,
  "encounter": {
    "encounterTitle": "...",
    "narrativeText": "...",
    "enemyName": "...",
    "enemyType": "combat",
    "availableActions": ["...", "...", "..."],
    "difficultyWeight": 2,
    "dmReasoning": "..."
  }
}
```

**Test rivalAgent:**
```bash
curl -X POST https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/rivalAgent \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "test-run-001",
    "enemyName": "Tunnel Goblin",
    "enemyType": "combat",
    "enemyHp": 6,
    "playerAction": "Attack",
    "playerHp": 9,
    "playerClass": "shadow_rogue",
    "combatTurns": 0
  }'
```

**Test lootAgent:**
```bash
curl -X POST https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/lootAgent \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "test-run-001",
    "playerId": "test-player-001",
    "playerClass": "shadow_rogue",
    "playStyle": "cautious",
    "floorNumber": 1,
    "winQuality": "clean",
    "eventLog": ["Floor 1: Attack vs Tunnel Goblin"]
  }'
```

**Test recapAgent:**
```bash
curl -X POST https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/recapAgent \
  -H "Content-Type: application/json" \
  -d '{
    "runId": "test-run-001",
    "playerId": "test-player-001",
    "playerClass": "shadow_rogue",
    "finalHp": 4,
    "floorsCompleted": 3,
    "died": true,
    "gold": 15,
    "playStyle": "cautious",
    "eventLog": ["Floor 1: Attack vs Tunnel Goblin", "Floor 2: Negotiate vs Bandit", "Floor 3: Flee vs Stone Golem"],
    "inventory": ["Worn Dagger"]
  }'
```

### Step 1.8 — Monitor function logs

```bash
# See all recent logs
firebase functions:log

# See logs for a specific function
firebase functions:log --only dmAgent

# Stream logs in real-time
firebase functions:log --follow
```

Common errors and fixes:

| Error | Cause | Fix |
|---|---|---|
| `GEMINI_API_KEY is not defined` | Config not set | Re-run Step 1.3 and redeploy |
| `JSON parse error` | Gemini returned non-JSON | Add: `text.replace(/```json\|```/g, '').trim()` before `JSON.parse()` |
| `CORS error from browser` | Missing CORS headers | Ensure `res.set("Access-Control-Allow-Origin", "*")` is first line |
| `Quota exceeded` | Too many Gemini calls | Add delay between test calls; check AI Studio quota |
| `Billing not enabled` | Cloud Functions require Blaze plan | Upgrade Firebase project to Blaze in console |
| `require is not defined` | TypeScript ES module syntax used | Ensure all functions use `require()` not `import` |

### Step 1.9 — Deploy a single function (for quick updates)

During development, redeploy only the function you changed:

```bash
firebase deploy --only functions:dmAgent
firebase deploy --only functions:rivalAgent
firebase deploy --only functions:lootAgent
firebase deploy --only functions:recapAgent
```

---

## Part 2: Host the Web Version via Firebase Hosting

The web version gives judges a URL they can open in a browser. This satisfies the "Web App (Optional)" deliverable and provides a reliable fallback if the APK install fails.

### Step 2.1 — Update the BASE_URL in api.ts

Make sure `src/services/api.ts` has the correct production function URL:

```typescript
const BASE_URL = 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net';
```

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID.

### Step 2.2 — Build the web version

```bash
npx expo export --platform web
```

This generates a `dist/` folder. Takes 1–3 minutes.

### Step 2.3 — Verify firebase.json points to dist folder

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions"
  }
}
```

The `rewrites` rule ensures that refreshing any URL doesn't return a 404.

### Step 2.4 — Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

On success:
```
✔  Deploy complete!
Hosting URL: https://YOUR_PROJECT_ID.web.app
```

### Step 2.5 — Test the web version

Open the Hosting URL. Complete a full test run:
- Select a class
- Complete at least 2 floors
- Verify the DM Reasoning panel appears
- Complete or die to trigger the Recap screen

Common web-specific issues:

| Issue | Fix |
|---|---|
| `firebaseConfig` is undefined | Ensure `firebase.ts` exports the config object correctly |
| App loads but API calls fail | Check CORS headers on Cloud Functions; confirm BASE_URL is correct |
| Blank white screen | Check browser console for JS errors; re-export |

### Step 2.6 — Re-deploy after frontend changes

```bash
npx expo export --platform web
firebase deploy --only hosting
```

---

## Part 3: Build and Distribute the Android APK

This is the **primary mobile deliverable** required by Challenge 4.

### Step 3.1 — Login to Expo and EAS

```bash
eas login
```

### Step 3.2 — Configure EAS Build

```bash
eas build:configure
```

Ensure `eas.json` contains:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

> **Why APK, not AAB?** An APK can be sideloaded directly on any Android device without the Play Store. AAB requires Play Store. For hackathon distribution, APK is always correct.

### Step 3.3 — Update app.json with Realm Explorer details

```json
{
  "expo": {
    "name": "Realm Explorer",
    "slug": "realm-explorer",
    "version": "1.0.0",
    "android": {
      "package": "com.yourname.realmexplorer",
      "versionCode": 1
    },
    "ios": {
      "bundleIdentifier": "com.yourname.realmexplorer"
    }
  }
}
```

Replace `yourname` with your actual name or team name.

### Step 3.4 — Start the APK build

```bash
eas build -p android --profile preview
```

This uploads your project to Expo's cloud build servers. Takes **10–15 minutes**.

> **Hackathon tip:** Start this build at the beginning of Day 3 (or end of Day 2), then handle other tasks while it runs.

### Step 3.5 — Download the APK

When the build completes:
1. Go to [expo.dev](https://expo.dev)
2. Navigate to your project → Builds
3. Click "Download" to get the `.apk` file

### Step 3.6 — Test the APK locally

**On a real Android device:**
1. Enable "Install unknown apps" in Settings → Security
2. Transfer the APK via USB or Google Drive
3. Tap the APK to install and open Realm Explorer

**On Android emulator:**
```bash
adb install path/to/realm-explorer.apk
```

### Step 3.7 — Register your app in Firebase (for App Distribution)

1. Firebase Console → Project Settings → Your apps → Add app → Android
2. Enter the package name: `com.yourname.realmexplorer`
3. Note the **App ID** (looks like `1:123456789:android:abcdef123456`)

### Step 3.8 — Upload APK to Firebase App Distribution

```bash
firebase appdistribution:distribute path/to/realm-explorer-preview.apk \
  --app YOUR_FIREBASE_ANDROID_APP_ID \
  --release-notes "Realm Explorer v1.0 — Google Antigravity Hackathon Build. An AI-powered dungeon crawler with 4 Gemini agents. Complete a dungeon run to see all agents in action." \
  --testers "judge1@hackathon.com,judge2@hackathon.com"
```

**Or distribute via Firebase Console:**
1. Firebase Console → App Distribution → Get started
2. Drag and drop your APK
3. Add release notes and tester emails
4. Click Distribute

### Step 3.9 — What judges receive

Judges get an email from Firebase with a direct link to install Realm Explorer. The flow is: Email link → Firebase App Tester → Install APK → Play game.

Include the App Distribution link in your hackathon submission form.

---

## Part 4: Expo Go (Fastest Option for Live Demo)

For the live presentation, skip the APK and use Expo Go — it's instant.

### Step 4.1 — Start the Expo dev server

```bash
npx expo start
```

A QR code appears in the terminal.

### Step 4.2 — Judges scan the QR code

Judges open **Expo Go** on their phone and scan the QR code. App loads instantly.

> **Requirement:** Demo device and the machine running `npx expo start` must be on the same Wi-Fi network.

### Step 4.3 — Tunnel mode (if same-network is unavailable)

```bash
npx expo start --tunnel
```

Routes traffic through Expo's servers. Slower but works on any network.

---

## Part 5: Recording the Demo Video

The hackathon requires a 3-minute demo video.

| Minute | Content |
|---|---|
| 0:00 – 0:30 | App launch on Android. Home screen. Player profile card. |
| 0:30 – 1:00 | Class selection. Show three classes. Select Shadow Rogue. |
| 1:00 – 2:00 | Encounter screen. Show DmThinkingPanel. Encounter loads. Show DM Reasoning panel. Make an action. Show Rival Agent resolving. Show HP change. Move to Floor 2. |
| 2:00 – 2:30 | Merchant screen (Floor 4). Show three AI-generated items. Show styleNote. |
| 2:30 – 3:00 | Recap screen. Typewriter story animation. Show run title badge. Briefly show `.agent/workflow_log.md` in Antigravity IDE as agent trace. |

**Recording tools:**
- **Android:** Built-in screen recorder (swipe down → Screen Record)
- **PC editing:** DaVinci Resolve (free) or CapCut

---

## Part 6: Hackathon Submission Package

| Item | Source | Format |
|---|---|---|
| Mobile App (MUST) | Firebase App Distribution | Email link to APK |
| Web App (Optional) | Firebase Hosting | `https://YOUR_PROJECT_ID.web.app` |
| Demo Video (3 min) | Screen recording | YouTube unlisted link or MP4 |
| Agent Trace / Logs | `.agent/workflow_log.md` | Paste into submission form or export as PDF |
| README | Repo `README.md` | Architecture, Antigravity usage, Gemini agents |
| Architecture Map | PRD.md (this repo) | Include as PDF or link to repo |

### Firestore data as agent trace supplement

1. Firebase Console → Firestore → `runs` collection
2. Click a test run → `encounters` subcollection
3. Screenshot `floor_1` through `floor_5` documents
4. These show `dmReasoning`, `difficultyWeight`, `playerChoice`, `outcome` — concrete evidence of agentic decision-making

---

## Part 7: Quick Reference Commands

```bash
# Development
npx expo start                              # Start Expo dev server + QR
npx expo start --tunnel                     # Tunnel mode (restricted networks)
npx expo start --web                        # Web only

# Firebase Functions (JavaScript)
firebase deploy --only functions            # Deploy all .js functions
firebase deploy --only functions:dmAgent    # Deploy one function
firebase functions:log                      # View recent logs
firebase functions:log --follow             # Stream logs live
firebase functions:config:get               # Check environment config

# Firebase Hosting
npx expo export --platform web              # Build web version → dist/
firebase deploy --only hosting              # Deploy web version

# EAS Build (Android APK)
eas build -p android --profile preview      # Build APK (cloud, ~10-15 min)
eas build:list                              # Check build status
eas build:view                              # Open build in browser

# Firebase App Distribution
firebase appdistribution:distribute app.apk \
  --app FIREBASE_APP_ID \
  --release-notes "Realm Explorer v1.0" \
  --testers "email@example.com"

# Local Firebase emulator (testing without deploying)
firebase emulators:start                    # Start Firestore + Functions emulators
firebase emulators:start --only firestore   # Firestore only
```

---

## Part 8: Troubleshooting Common Issues

| Issue | Diagnosis | Fix |
|---|---|---|
| Cloud Function cold start (>10s) | First request after inactivity | Add a "wake-up" dummy call on HomeScreen mount |
| APK installs but crashes | JS bundle error | Run `eas build` logs at expo.dev to find the error |
| Firebase Hosting shows old version | Browser cache | Force refresh (Ctrl+Shift+R) or open in incognito |
| EAS Build fails: "No credentials" | Expo needs keystore | Run `eas credentials` to auto-generate a debug keystore |
| App Distribution email not received | Wrong email or spam | Check spam; resend from Firebase Console |
| Gemini returns non-JSON | Model added preamble | Add `text.replace(/```json\|```/g, '').trim()` before `JSON.parse()` |
| `firebase: command not found` | CLI not in PATH | Run `npm install -g firebase-tools` again |
| `eas: command not found` | EAS CLI not in PATH | Run `npm install -g eas-cli` |
| Firestore permission denied | Security rules | Temporarily allow all reads/writes in `firestore.rules` for hackathon |
| `require is not defined` in functions | ES module syntax used | Replace all `import` with `require()` in `functions/` |
| `Cannot find module` in functions | Missing `.js` extension in require | Use `require('../firebase-init.js')` not `require('../firebase-init')` |
