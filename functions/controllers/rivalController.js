const geminiService = require('../services/geminiService');
const firestoreService = require('../services/firestoreService');
const fairnessService = require('../services/fairnessService');

async function resolve(req, res, next) {
  try {
    const { runId, enemyName, enemyType, enemyHp, playerAction, playerHp, playerClass, combatTurns, floorNumber, difficultyWeight } = req.body;

    const rawResult = await geminiService.callRival({
      runId, enemyName, enemyType,
      enemyHp: Number(enemyHp),
      playerAction,
      playerHp: Number(playerHp),
      playerClass,
      combatTurns: Number(combatTurns)
    });

    const combat = fairnessService.validate(rawResult, Number(combatTurns), Number(playerHp));

    await firestoreService.saveCombat(runId, { ...combat, combatTurns: Number(combatTurns) });

    const newHp = Math.max(0, Number(playerHp) + combat.playerHpDelta);
    const newEnemyHp = Math.max(0, Number(enemyHp) + combat.enemyHpDelta);
    const nextCombatTurns = Number(combatTurns) + 1;

    await firestoreService.updateEncounterCombatState(runId, Number(floorNumber), {
      currentEnemyHp: newEnemyHp,
      combatTurns: nextCombatTurns,
      lastPlayerAction: playerAction
    });

    await firestoreService.updateRunAfterCombat(
      runId, newHp,
      combat.combatOver && combat.playerWon,
      Number(floorNumber) || 1,
      Number(difficultyWeight) || 2
    );

    return res.status(200).json({
      success: true,
      data: { combat, newHp, newEnemyHp, combatTurns: nextCombatTurns }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { resolve };
