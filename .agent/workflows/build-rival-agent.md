---
description: Create the enemy AI opponent as an Express controller with Fairness Referee in JavaScript
---

1. Create /functions/prompts/rival-prompt.js: export buildRivalPrompt({ enemyName, enemyType, enemyHp, playerAction, playerHp, playerClass, combatTurns }). Returns a string. Instruct Gemini ONLY with valid JSON. Schema: outcomeText, playerHpDelta (negative), enemyHpDelta (negative), combatOver (boolean), playerWon (boolean), winQuality (clean/close/messy), rivalReasoning. Embed fairness rules in prompt. Embed escalation note for combatTurns > 3.

2. Create /functions/services/fairnessService.js: export validate(rivalResult, combatTurns, playerHp). Clamp playerHpDelta to -3 if combatTurns === 0 && Math.abs > 3. Force combatOver true playerWon false if combatTurns > 6. Recalculate winQuality if missing or invalid. Return corrected result. Pure function, no Firestore calls.

3. Create /functions/controllers/rivalController.js: require geminiService, firestoreService, fairnessService. Export resolve(req, res, next). Extract all rival fields plus floorNumber, difficultyWeight from req.body. Call geminiService.callRival. Apply fairnessService.validate. Call firestoreService.saveCombat. Call firestoreService.updateRunAfterCombat with newHp, floorWon flag, floorNumber, difficultyWeight. Return res.status(200).json({ success: true, data: { combat, newHp } }). Pass errors to next(err).

4. Add updateRunAfterCombat to firestoreService.js: updates hp, increments currentFloor and gold (floorNumber * difficultyWeight * 2) on floor win using FieldValue.increment.

5. Register POST /api/v1/rival in agentRoutes.js with validate list including floorNumber.

6. Append log entry to .agent/workflow_log.md.
