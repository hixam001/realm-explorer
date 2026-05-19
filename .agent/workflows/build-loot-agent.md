---
description: Create the contextual item reward generator as an Express controller in JavaScript
---

1. Create /functions/prompts/loot-prompt.js: export buildLootPrompt({ playerClass, playStyle, floorNumber, winQuality, eventLog, variation }). Returns a string. Instruct Gemini ONLY with valid JSON. Schema: itemName, itemEffect, styleNote, flavorText, itemType (weapon/armor/ring/consumable). Power scaling: clean → powerful, messy → weak. styleNote must explain why item suits this player's behaviour. flavorText must reference most recent eventLog event. variation parameter (1/2/3) for merchant mode to ensure distinct items.

2. Create /functions/controllers/lootController.js: require geminiService, firestoreService. Export generate(req, res, next). If merchantMode === true: call geminiService.callLoot 3 times in parallel (Promise.all with variation 1/2/3), call firestoreService.saveMerchantInventory, return items array. Normal mode: call once, saveLoot, return single item. Pass errors to next(err).

3. Add saveMerchantInventory to firestoreService.js: Firestore batch write of 3 loot docs with merchantItem: true. Does NOT add to inventory array (player must purchase first).

4. Register POST /api/v1/loot in agentRoutes.js.

5. Append log entry to .agent/workflow_log.md.
