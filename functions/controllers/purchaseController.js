const firestoreService = require('../services/firestoreService');

const ITEM_COST = {
  weapon: 10,
  armor: 8,
  ring: 12,
  consumable: 5
};

async function purchase(req, res, next) {
  try {
    const { runId, playerId, itemName, itemType, itemEffect, styleNote, flavorText } = req.body;

    const cost = ITEM_COST[itemType] || 8;

    const result = await firestoreService.processPurchase(runId, playerId, {
      itemName,
      itemType,
      itemEffect,
      styleNote,
      flavorText,
      cost
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        goldAvailable: result.goldAvailable
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        itemName,
        goldSpent: cost,
        goldRemaining: result.goldRemaining,
        inventory: result.inventory
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { purchase };
