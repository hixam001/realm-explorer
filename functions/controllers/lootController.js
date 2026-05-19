const geminiService = require('../services/geminiService');
const firestoreService = require('../services/firestoreService');

async function generate(req, res, next) {
  try {
    const { runId, playerId, playerClass, playStyle, floorNumber, winQuality, eventLog, merchantMode } = req.body;

    const lootParams = { playerClass, playStyle, floorNumber: Number(floorNumber), winQuality, eventLog: eventLog || [] };

    if (merchantMode === true) {
      const [item1, item2, item3] = await Promise.all([
        geminiService.callLoot({ ...lootParams, variation: 1 }),
        geminiService.callLoot({ ...lootParams, variation: 2 }),
        geminiService.callLoot({ ...lootParams, variation: 3 })
      ]);
      const items = [item1, item2, item3];
      await firestoreService.saveMerchantInventory(runId, items);
      return res.status(200).json({ success: true, data: { items } });
    }

    const item = await geminiService.callLoot(lootParams);
    await firestoreService.saveLoot(runId, item, Number(floorNumber));

    return res.status(200).json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
}

module.exports = { generate };
