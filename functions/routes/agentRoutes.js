const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');

const runController = require('../controllers/runController');
const resumeController = require('../controllers/resumeController');
const purchaseController = require('../controllers/purchaseController');
const dmController = require('../controllers/dmController');
const rivalController = require('../controllers/rivalController');
const lootController = require('../controllers/lootController');
const recapController = require('../controllers/recapController');

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.post(
  '/run',
  validate(['playerId', 'playerClass']),
  runController.create
);

router.get('/run/:runId', resumeController.getState);

router.post(
  '/purchase',
  validate(['runId', 'playerId', 'itemName', 'itemType', 'itemEffect']),
  purchaseController.purchase
);

router.post(
  '/dm',
  validate(['runId', 'playerId', 'floorNumber', 'playerClass', 'hp', 'maxHp', 'playStyle', 'actionHistory', 'eventLog']),
  dmController.generate
);

router.post(
  '/rival',
  validate(['runId', 'enemyName', 'enemyType', 'enemyHp', 'playerAction', 'playerHp', 'playerClass', 'combatTurns', 'floorNumber']),
  rivalController.resolve
);

router.post(
  '/loot',
  validate(['runId', 'playerId', 'playerClass', 'playStyle', 'floorNumber', 'winQuality', 'eventLog']),
  lootController.generate
);

router.post(
  '/recap',
  validate(['runId', 'playerId', 'playerClass', 'finalHp', 'floorsCompleted', 'died', 'gold', 'playStyle', 'eventLog', 'inventory']),
  recapController.generate
);

module.exports = router;
