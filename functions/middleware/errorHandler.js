const FALLBACKS = {
  '/v1/dm': {
    encounterTitle: 'The Dark Corridor',
    narrativeText: 'A goblin blocks your path, watching you with hungry eyes. The air smells of damp stone and old blood.',
    enemyName: 'Tunnel Goblin',
    enemyType: 'combat',
    availableActions: ['Attack', 'Negotiate', 'Examine surroundings', 'Flee'],
    difficultyWeight: 2,
    dmReasoning: 'Fallback encounter triggered due to API error.'
  },
  '/v1/rival': {
    outcomeText: 'The enemy stumbles back, surprised by your move.',
    playerHpDelta: -1,
    enemyHpDelta: -2,
    combatOver: false,
    playerWon: false,
    winQuality: 'messy',
    rivalReasoning: 'Fallback combat resolution triggered due to API error.'
  },
  '/v1/loot': {
    itemName: 'Worn Dagger',
    itemEffect: '+1 to your next attack roll.',
    styleNote: 'A basic blade for any adventurer.',
    flavorText: 'Its edge is dull, but its intent is clear.',
    itemType: 'weapon'
  },
  '/v1/recap': {
    narrativeText: 'Your run ended in darkness, but the dungeon remembers your name.',
    runTitle: 'The Unknown Wanderer'
  }
};

function errorHandler(err, req, res, next) {
  console.error(`[ErrorHandler] ${req.method} ${req.path} — ${err.message}`);

  const fallback = FALLBACKS[req.path];

  if (fallback) {
    return res.status(200).json({ success: true, data: fallback, fallback: true });
  }

  return res.status(500).json({ success: false, error: 'Unknown endpoint error.' });
}

module.exports = errorHandler;
