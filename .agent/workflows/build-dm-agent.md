---
description: Create the Dungeon Master agent as an Express controller and Gemini prompt in JavaScript
---

1. Read GEMINI.md and .agent/rules.md to confirm JavaScript-only backend rules and MVC structure.

2. Create /functions/prompts/dm-prompt.js: export buildDmPrompt({ floorNumber, playerClass, hp, maxHp, playStyle, actionHistory, eventLog }). Returns a string. Instruct Gemini to respond ONLY with valid JSON. Schema: encounterTitle, narrativeText, enemyName, enemyType, availableActions (3-5 strings), difficultyWeight (1-5), dmReasoning. Embed playStyle adaptation rules: aggressive combat, diplomatic hybrid, cautious trap/stealth, unpredictable randomised. Embed low-HP rule: if hp < maxHp * 0.3, reduce difficultyWeight by 1.

3. Create /functions/controllers/dmController.js: require geminiService, firestoreService. Export generate(req, res, next). Extract runId, playerId, floorNumber, playerClass, hp, maxHp, playStyle, actionHistory, eventLog from req.body. Call geminiService.callDm. Call firestoreService.saveEncounter. Return res.status(200).json({ success: true, data: { encounter } }). Pass errors to next(err).

4. Register POST /api/v1/dm in /functions/routes/agentRoutes.js with validate(['runId','playerId','floorNumber','playerClass','hp','maxHp','playStyle','actionHistory','eventLog']).

5. Verify no syntax errors by checking require chain.

6. Append log entry to .agent/workflow_log.md with reasoning for prompt structure choices.
