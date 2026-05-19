---
description: Create the end-of-run narrative generator as an Express controller in JavaScript
---

1. Create /functions/prompts/recap-prompt.js: export buildRecapPrompt({ playerClass, finalHp, floorsCompleted, died, gold, playStyle, eventLog, inventory }). Returns a string. Instruct Gemini ONLY with valid JSON. Schema: narrativeText, runTitle. narrativeText: second-person, 3-5 sentences, references ≥2 specific eventLog events, reflects class and playStyle. runTitle: unique 2-5 words specific to this run.

2. Create /functions/controllers/recapController.js: require geminiService, firestoreService. Export generate(req, res, next). Call geminiService.callRecap. Call firestoreService.saveRecap. Call firestoreService.updatePlayerProfile (uses Firestore transaction for bestDepth comparison). Call firestoreService.updateRunState with status: died ? 'died' : 'completed'. Return res.status(200).json({ success: true, data: { recap } }). Pass errors to next(err).

3. Fix updatePlayerProfile in firestoreService.js to use db.runTransaction: read current bestDepth, compare with floorsCompleted, write Math.max. Use FieldValue.increment(1) for runsCompleted and FieldValue.arrayUnion(runTitle) for allTimeTitles.

4. Register POST /api/v1/recap in agentRoutes.js.

5. Append log entry to .agent/workflow_log.md.
