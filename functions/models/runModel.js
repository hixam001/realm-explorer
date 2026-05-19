const admin = require('../firebase-init').admin;

function buildRun({ playerId, playerClass, hp, maxHp }) {
  if (!playerId || !playerClass || hp === undefined || maxHp === undefined) {
    throw new Error('buildRun: missing required params');
  }
  return {
    playerId,
    playerClass,
    hp: Number(hp),
    maxHp: Number(maxHp),
    gold: 0,
    currentFloor: 1,
    playStyle: 'cautious',
    actionHistory: [],
    eventLog: [],
    inventory: [],
    status: 'active',
    startedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

module.exports = { buildRun };
