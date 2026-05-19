const admin = require('../firebase-init').admin;

function buildPlayerUpdate({ runTitle, floorsCompleted, playerClass }) {
  return {
    runsCompleted: admin.firestore.FieldValue.increment(1),
    allTimeTitles: admin.firestore.FieldValue.arrayUnion(runTitle),
    bestDepth: Number(floorsCompleted),
    favoriteClass: playerClass,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

module.exports = { buildPlayerUpdate };
