const geminiService = require('../services/geminiService');
const firestoreService = require('../services/firestoreService');

async function generate(req, res, next) {
  try {
    const { runId, playerId, playerClass, finalHp, floorsCompleted, died, gold, playStyle, eventLog, inventory } = req.body;

    const recap = await geminiService.callRecap({
      playerClass,
      finalHp: Number(finalHp),
      floorsCompleted: Number(floorsCompleted),
      died: Boolean(died),
      gold: Number(gold),
      playStyle,
      eventLog: eventLog || [],
      inventory: inventory || []
    });

    await firestoreService.saveRecap(playerId, runId, recap);
    await firestoreService.updatePlayerProfile(playerId, {
      runTitle: recap.runTitle,
      floorsCompleted: Number(floorsCompleted),
      playerClass,
      playStyle,
      died: Boolean(died)
    });
    await firestoreService.updateRunState(runId, {
      status: died ? 'died' : 'completed',
      finalHp: Number(finalHp),
      floorsCompleted: Number(floorsCompleted)
    });

    return res.status(200).json({ success: true, data: { recap } });
  } catch (err) {
    next(err);
  }
}

module.exports = { generate };
