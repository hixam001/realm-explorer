function buildLootPrompt({ playerClass, playStyle, floorNumber, winQuality, eventLog, variation }) {
  const powerMap = {
    clean: 'Award a powerful, meaningful item. The player earned it.',
    close: 'Award a moderate item. The player survived but struggled.',
    messy: 'Award a weak item. The player barely made it through.'
  };
  const powerInstruction = powerMap[winQuality] || powerMap.messy;

  const recentEvent = eventLog && eventLog.length > 0
    ? eventLog[eventLog.length - 1]
    : 'the encounter';

  const variationNote = variation
    ? `This is item option ${variation} of 3 for the merchant. Make it distinct from the other options in both itemType and theme.`
    : '';

  return `You are the Loot AI for a roguelike RPG called Realm Explorer. Generate a contextual item reward.

PLAYER STATE:
- Class: ${playerClass}
- Play Style: ${playStyle}
- Floor: ${floorNumber}
- Win Quality: ${winQuality}
- Most Recent Event: "${recentEvent}"

POWER SCALING: ${powerInstruction}
${variationNote}

REQUIREMENTS:
- styleNote must explain specifically why this item suits THIS player's observed play style.
- flavorText must reference the most recent event from the event log above.
- Do not generate generic loot. Every field should feel personal to this run.

Respond ONLY with valid JSON. No markdown, no preamble.

Required JSON schema:
{
  "itemName": "string — unique, evocative name",
  "itemEffect": "string — clear mechanical description",
  "styleNote": "string — why this item suits this specific player's behaviour",
  "flavorText": "string — atmospheric lore sentence referencing the recent event",
  "itemType": "weapon | armor | ring | consumable"
}`;
}

module.exports = { buildLootPrompt };
