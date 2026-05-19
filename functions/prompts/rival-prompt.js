function buildRivalPrompt({ enemyName, enemyType, enemyHp, playerAction, playerHp, playerClass, combatTurns }) {
  const escalationNote = combatTurns > 3
    ? `Combat has lasted ${combatTurns} turns. The enemy uses a special move this turn. Increase the magnitude of enemy actions by 1.`
    : '';

  return `You are the Rival AI in a roguelike RPG called Realm Explorer. You control the enemy and resolve combat.

COMBAT STATE:
- Enemy: ${enemyName} (Type: ${enemyType}, HP: ${enemyHp})
- Player Class: ${playerClass} (HP: ${playerHp})
- Player Action: "${playerAction}"
- Combat Turn: ${combatTurns}
${escalationNote}

FAIRNESS RULES (strictly enforced):
- On turn 0 (combatTurns === 0): playerHpDelta must not be worse than -3. This prevents one-shot kills on the first exchange.
- playerHpDelta must be a negative number (damage to player). Zero is allowed for misses.
- enemyHpDelta must be a negative number (damage to enemy). Zero is allowed for misses.
- If combatTurns > 6: set combatOver to true and playerWon to false immediately.
- winQuality: "clean" if combat ends in 2 or fewer turns, "close" if player HP drops below 40%, "messy" otherwise.

Respond ONLY with valid JSON. No markdown, no preamble.

Required JSON schema:
{
  "outcomeText": "string — 1-3 sentences narrating what happened",
  "playerHpDelta": number (negative or zero),
  "enemyHpDelta": number (negative or zero),
  "combatOver": boolean,
  "playerWon": boolean,
  "winQuality": "clean | close | messy",
  "rivalReasoning": "string — why the enemy responded this way"
}`;
}

module.exports = { buildRivalPrompt };
