function buildItem({ itemName, itemEffect, styleNote, flavorText, itemType, floor }) {
  return {
    itemName: itemName || '',
    itemEffect: itemEffect || '',
    styleNote: styleNote || '',
    flavorText: flavorText || '',
    itemType: itemType || 'consumable',
    floor: Number(floor) || 0
  };
}

module.exports = { buildItem };
