const { admin, db, FieldValue } = require('../firebase-init');
const { v4: uuidv4 } = require('uuid');

async function createRun(runId, params) {
  const { playerId, playerClass, hp, maxHp } = params;
  await db.collection('runs').doc(runId).set({
    playerId,
    playerClass,
    hp,
    maxHp,
    gold: 0,
    currentFloor: 1,
    playStyle: 'cautious',
    actionHistory: [],
    eventLog: [],
    inventory: [],
    status: 'active',
    startedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });
}

async function saveEncounter(runId, floorNumber, encounter) {
  await db.collection('runs').doc(runId)
    .collection('encounters').doc(`floor_${floorNumber}`)
    .set({
      ...encounter,
      playerChoice: null,
      outcome: null,
      hpAfter: null,
      timestamp: FieldValue.serverTimestamp()
    }, { merge: true });
}

async function updateEncounterOutcome(runId, floorNumber, playerChoice, outcome, hpAfter) {
  await db.collection('runs').doc(runId)
    .collection('encounters').doc(`floor_${floorNumber}`)
    .set({ playerChoice, outcome, hpAfter }, { merge: true });
}

async function saveCombat(runId, combatResult) {
  const combatId = uuidv4();
  await db.collection('runs').doc(runId)
    .collection('combat').doc(combatId)
    .set({
      ...combatResult,
      timestamp: FieldValue.serverTimestamp()
    }, { merge: true });
  return combatId;
}

async function saveLoot(runId, item, floor) {
  const lootId = uuidv4();
  await db.collection('runs').doc(runId)
    .collection('loot').doc(lootId)
    .set({
      ...item,
      floor,
      timestamp: FieldValue.serverTimestamp()
    }, { merge: true });

  await db.collection('runs').doc(runId).set({
    inventory: FieldValue.arrayUnion(item.itemName),
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });

  return lootId;
}

async function saveMerchantInventory(runId, items) {
  const batch = db.batch();
  items.forEach((item) => {
    const ref = db.collection('runs').doc(runId).collection('loot').doc(uuidv4());
    batch.set(ref, {
      ...item,
      floor: 4,
      merchantItem: true,
      timestamp: FieldValue.serverTimestamp()
    });
  });
  await batch.commit();
}

async function saveRecap(playerId, runId, recap) {
  await db.collection('players').doc(playerId)
    .collection('recaps').doc(runId)
    .set({
      narrativeText: recap.narrativeText,
      runTitle: recap.runTitle,
      timestamp: FieldValue.serverTimestamp()
    }, { merge: true });
}

async function updatePlayerProfile(playerId, params) {
  const { runTitle, floorsCompleted, playerClass, playStyle, died } = params;
  const playerRef = db.collection('players').doc(playerId);

  await db.runTransaction(async (transaction) => {
    const playerDoc = await transaction.get(playerRef);
    const data = playerDoc.exists ? playerDoc.data() : {};

    const currentBest = data.bestDepth || 0;
    const newBest = Math.max(currentBest, Number(floorsCompleted));

    const styleHistory = data.styleHistory || [];
    const newEntry = { playStyle, floorsCompleted: Number(floorsCompleted), died: Boolean(died) };
    const updatedHistory = [...styleHistory, newEntry].slice(-10);

    const styleCounts = updatedHistory.reduce((acc, e) => {
      acc[e.playStyle] = (acc[e.playStyle] || 0) + 1;
      return acc;
    }, {});
    const dominantStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unpredictable';
    const avgFloors = Math.round(
      updatedHistory.reduce((sum, e) => sum + e.floorsCompleted, 0) / updatedHistory.length
    );
    const survivalRate = Math.round(
      (updatedHistory.filter((e) => !e.died).length / updatedHistory.length) * 100
    );

    transaction.set(playerRef, {
      runsCompleted: FieldValue.increment(1),
      allTimeTitles: FieldValue.arrayUnion(runTitle),
      bestDepth: newBest,
      favoriteClass: playerClass,
      styleHistory: updatedHistory,
      dominantStyle,
      averageFloorsCompleted: avgFloors,
      survivalRate,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
}

async function getPlayerProfile(playerId) {
  const doc = await db.collection('players').doc(playerId).get();
  if (!doc.exists) return null;
  return doc.data();
}

async function updateRunAfterCombat(runId, newHp, floorWon, floorNumber, difficultyWeight) {
  const updates = {
    hp: newHp,
    updatedAt: FieldValue.serverTimestamp()
  };

  if (floorWon) {
    const goldReward = floorNumber * difficultyWeight * 2;
    updates.currentFloor = FieldValue.increment(1);
    updates.gold = FieldValue.increment(goldReward);
  }

  await db.collection('runs').doc(runId).set(updates, { merge: true });
}

async function updateRunState(runId, fields) {
  await db.collection('runs').doc(runId).set({
    ...fields,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
}

async function updateEncounterCombatState(runId, floorNumber, fields) {
  await db.collection('runs').doc(runId)
    .collection('encounters').doc(`floor_${floorNumber}`)
    .set(fields, { merge: true });
}

async function getRunState(runId, playerId) {
  const runDoc = await db.collection('runs').doc(runId).get();
  if (!runDoc.exists) return null;

  const run = { id: runDoc.id, ...runDoc.data() };

  if (playerId && run.playerId !== playerId) return null;

  const currentFloor = run.currentFloor || 1;
  const encounterDoc = await db.collection('runs').doc(runId)
    .collection('encounters').doc(`floor_${currentFloor}`)
    .get();

  run.currentEncounter = encounterDoc.exists ? encounterDoc.data() : null;

  return run;
}

async function processPurchase(runId, playerId, item) {
  const runRef = db.collection('runs').doc(runId);
  let goldRemaining = 0;
  let inventory = [];

  const purchaseResult = await db.runTransaction(async (transaction) => {
    const runDoc = await transaction.get(runRef);
    if (!runDoc.exists) return { success: false, error: 'Run not found' };

    const runData = runDoc.data();
    if (runData.playerId !== playerId) return { success: false, error: 'Unauthorised' };

    const currentGold = runData.gold || 0;
    if (currentGold < item.cost) {
      return { success: false, error: 'Insufficient gold', goldAvailable: currentGold };
    }

    goldRemaining = currentGold - item.cost;
    inventory = [...(runData.inventory || []), item.itemName];

    transaction.set(runRef, {
      gold: goldRemaining,
      inventory: FieldValue.arrayUnion(item.itemName),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return { success: true, goldRemaining, inventory };
  });

  return purchaseResult;
}

module.exports = {
  createRun,
  saveEncounter,
  updateEncounterOutcome,
  updateEncounterCombatState,
  saveCombat,
  saveLoot,
  saveMerchantInventory,
  saveRecap,
  updatePlayerProfile,
  updateRunAfterCombat,
  updateRunState,
  getRunState,
  getPlayerProfile,
  processPurchase
};
