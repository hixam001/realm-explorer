---
description: Initialise Firebase project structure and JavaScript functions directory
---

1. Create /functions/package.json with name realm-explorer-functions, main index.js, engines node 20, dependencies firebase-functions ^4.0.0 firebase-admin ^12.0.0 @google/generative-ai ^0.21.0 express ^4.18.0 cors ^2.8.5 uuid ^9.0.0. No TypeScript packages.

2. Create /functions/firebase-init.js using CommonJS. Guard against double-init. Export { admin, db }.

3. Create /functions/index.js: initialise Express app, register corsMiddleware and express.json() globally, mount agentRoutes at root, register errorHandler last, export exports.api = functions.https.onRequest(app).

4. Create firebase.json: hosting.public = "dist", functions.source = "functions", rewrites source ** destination /index.html.

5. Create firestore.rules: auth-gated rules per collection. players read/write for matching uid. runs read for matching playerId, create allowed, update/delete blocked. Subcollections read-only for authenticated users.

6. Create eas.json: preview profile android buildType apk. production profile android buildType aab.

7. Create app.json: name Realm Explorer, slug realm-explorer, android.package com.realmexplorer.app.

8. Create .gitignore: .env, functions/.env, node_modules/, dist/, .expo/.

9. Append log entry to .agent/workflow_log.md.
