function buildRecapPrompt({ playerClass, finalHp, floorsCompleted, died, gold, playStyle, eventLog, inventory }) {
  const outcome = died ? 'died in the dungeon' : `cleared all ${floorsCompleted} floors`;
  const inventoryList = inventory && inventory.length > 0 ? inventory.join(', ') : 'nothing';
  const eventSummary = eventLog && eventLog.length > 0
    ? eventLog.join('\n- ')
    : 'no recorded events';

  return `You are the Recap AI for a roguelike RPG called Realm Explorer. Write the end-of-run story.

RUN SUMMARY:
- Player Class: ${playerClass}
- Outcome: Player ${outcome}
- Final HP: ${finalHp}
- Floors Completed: ${floorsCompleted} of 5
- Gold Collected: ${gold}
- Play Style: ${playStyle}
- Final Inventory: ${inventoryList}

FULL EVENT LOG:
- ${eventSummary}

REQUIREMENTS:
- narrativeText: Write 3-5 sentences in second person ("You descended..."). Reference at least 2 specific events from the event log by name. Reflect the player's class and play style. Make it feel unique to this exact run.
- runTitle: A unique 2-5 word title for this specific run. Must reflect actual run events. Never use "The Unknown Wanderer" or generic titles unless the run was truly uneventful.

Respond ONLY with valid JSON. No markdown, no preamble.

Required JSON schema:
{
  "narrativeText": "string",
  "runTitle": "string"
}`;
}

module.exports = { buildRecapPrompt };
