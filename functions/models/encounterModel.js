function buildEncounter({ floorNumber, encounterTitle, narrativeText, enemyName, enemyType, availableActions, difficultyWeight, dmReasoning }) {
  return {
    floorNumber: Number(floorNumber),
    encounterTitle: encounterTitle || '',
    narrativeText: narrativeText || '',
    enemyName: enemyName || '',
    enemyType: enemyType || 'combat',
    availableActions: availableActions || [],
    difficultyWeight: Number(difficultyWeight) || 2,
    dmReasoning: dmReasoning || '',
    playerChoice: null,
    outcome: null,
    hpAfter: null
  };
}

module.exports = { buildEncounter };
