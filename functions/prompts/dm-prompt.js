function buildDmPrompt({ floorNumber, playerClass, hp, maxHp, playStyle, actionHistory, eventLog, playerProfile }) {
  const hpPercent = maxHp > 0 ? (hp / maxHp) * 100 : 100;
  const lowHpNote = hpPercent < 30
    ? 'Player HP is below 30%. Reduce difficultyWeight by 1 from what you would normally assign.'
    : '';

  const styleRules = {
    aggressive: 'Generate a combat-type enemy with high stakes. Set difficultyWeight 4-5.',
    diplomatic: 'Generate a hybrid or negotiation-type enemy. Dialogue-first encounter.',
    cautious: 'Generate a trap or stealth-type encounter. Player should have avoidance options.',
    unpredictable: 'Randomise enemy type and narrative style. Highest narrative variety.'
  };

  const styleInstruction = styleRules[playStyle] || styleRules.unpredictable;

  let historyBlock = '';
  if (playerProfile && playerProfile.runsCompleted > 0) {
    const {
      runsCompleted = 0,
      bestDepth = 0,
      dominantStyle = 'unknown',
      averageFloorsCompleted = 0,
      survivalRate = 0,
      allTimeTitles = []
    } = playerProfile;

    const veteranNote = runsCompleted >= 5
      ? 'This is a veteran player. Do not hold back. Increase encounter complexity and narrative depth.'
      : runsCompleted === 1
        ? 'This is only the player\'s second run. Keep narrative clear and avoid overwhelming choices.'
        : '';

    const styleConsistency = dominantStyle === playStyle
      ? `Their dominant style across all runs is "${dominantStyle}" — consistent with this run. Lean into it deeply.`
      : `Their dominant style across all runs is "${dominantStyle}" but they are playing "${playStyle}" this run — this is unusual. Reflect this tension in the encounter narrative.`;

    const survivalContext = survivalRate < 40
      ? 'This player dies often. Do not generate impossible encounters — they need a fighting chance.'
      : survivalRate > 80
        ? 'This player rarely dies. Challenge them. Routine encounters are not enough.'
        : '';

    const depthContext = bestDepth < 3
      ? 'Player has never cleared beyond Floor 3 in any run. This floor may feel like new territory.'
      : `Player has reached as deep as Floor ${bestDepth} before. Depth ${floorNumber} is familiar ground — make it feel meaningfully different from their past experiences.`;

    historyBlock = `
PLAYER HISTORY (across ${runsCompleted} total runs):
- Dominant Play Style: ${dominantStyle}
- Best Depth Reached: Floor ${bestDepth}
- Average Floors Completed: ${averageFloorsCompleted}
- Survival Rate: ${survivalRate}%
- Past Run Titles: ${allTimeTitles.slice(-3).join(', ') || 'none yet'}

HISTORY RULES:
- ${styleConsistency}
- ${depthContext}
${survivalContext ? `- ${survivalContext}` : ''}
${veteranNote ? `- ${veteranNote}` : ''}
- Your dmReasoning MUST explicitly reference the player's history (runsCompleted, dominantStyle, or bestDepth) to explain your choices.`;
  }

  return `You are the Dungeon Master AI for a roguelike RPG called Realm Explorer.

CURRENT RUN STATE:
- Class: ${playerClass}
- Floor: ${floorNumber} of 5
- HP: ${hp} / ${maxHp}
- Play Style This Run: ${playStyle}
- Action History: ${actionHistory.length > 0 ? actionHistory.join(', ') : 'none yet'}
- Event Log: ${eventLog.length > 0 ? eventLog.join(' | ') : 'none yet'}

STYLE RULE: ${styleInstruction}
${lowHpNote}
${historyBlock}

Generate a unique encounter for this floor. Respond ONLY with valid JSON. No markdown, no preamble, no explanation outside the JSON object.

Required JSON schema:
{
  "encounterTitle": "string — short dramatic title",
  "narrativeText": "string — 2-3 sentences setting the scene, second person",
  "enemyName": "string",
  "enemyType": "combat | negotiation | hybrid",
  "availableActions": ["string", "string", "string"] (3 to 5 actions),
  "difficultyWeight": 1-5 (integer),
  "dmReasoning": "string — plain English explanation of why you made these choices. Must reference player history if available."
}`;
}

module.exports = { buildDmPrompt };

