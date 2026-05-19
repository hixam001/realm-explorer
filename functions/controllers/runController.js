const firestoreService = require('../services/firestoreService');
const { v4: uuidv4 } = require('uuid');

const CLASS_HP = {
  blade_dancer: 10,
  ember_mage: 8,
  shadow_rogue: 9
};

async function create(req, res, next) {
  try {
    const { playerId, playerClass } = req.body;
    const runId = uuidv4();
    const maxHp = CLASS_HP[playerClass] || 9;

    await firestoreService.createRun(runId, { playerId, playerClass, hp: maxHp, maxHp });

    return res.status(200).json({ success: true, data: { runId, hp: maxHp, maxHp } });
  } catch (err) {
    next(err);
  }
}

module.exports = { create };
