function validate(rivalResult, combatTurns, playerHp) {
  const result = { ...rivalResult };

  if (combatTurns === 0 && Math.abs(result.playerHpDelta) > 3) {
    result.playerHpDelta = -3;
  }

  if (combatTurns > 6) {
    result.combatOver = true;
    result.playerWon = false;
  }

  const validQualities = ['clean', 'close', 'messy'];
  if (!validQualities.includes(result.winQuality)) {
    const hpRemaining = playerHp + result.playerHpDelta;
    const hpRatio = playerHp > 0 ? hpRemaining / playerHp : 0;
    if (combatTurns <= 2) {
      result.winQuality = 'clean';
    } else if (hpRatio < 0.4) {
      result.winQuality = 'close';
    } else {
      result.winQuality = 'messy';
    }
  }

  return result;
}

module.exports = { validate };
