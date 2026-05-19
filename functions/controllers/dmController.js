const geminiService = require('../services/geminiService');
const firestoreService = require('../services/firestoreService');

async function generate(req, res, next) {
  try {
    const { runId, playerId, floorNumber, playerClass, hp, maxHp, playStyle, actionHistory, eventLog } = req.body;

    const playerProfile = await firestoreService.getPlayerProfile(playerId);

    const encounter = await geminiService.callDm({
      runId, playerId, floorNumber, playerClass,
      hp: Number(hp),
      maxHp: Number(maxHp || hp),
      playStyle,
      actionHistory: actionHistory || [],
      eventLog: eventLog || [],
      playerProfile
    });

    await firestoreService.saveEncounter(runId, floorNumber, encounter);

    return res.status(200).json({ success: true, data: { encounter } });
  } catch (err) {
    next(err);
  }
}

module.exports = { generate };

