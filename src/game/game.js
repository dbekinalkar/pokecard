const {
  getUserPacks,
  deleteUserPacks,
  updateUserInventory,
  getUserInventory,
} = require("../db/db.js");
const { openPack } = require("./card/pack.js");

const generateCards = (id, packs) => {
  let packsToOpen = Math.min(getUserPacks(id, packs), packs);

  const cards = [];
  for (;packsToOpen > 0; packsToOpen--) {
    cards.push(openPack());
  }

  updateUserInventory(id, cards);

  const packsLeft = deleteUserPacks(id, packs);

  return [cards, packsLeft];
};

const getUserInventoryCards = (id) => {
  const inventory = getUserInventory(id);

  return Object.values(
    inventory.reduce((map, element) => {
      if (!map[element.id]) {
        map[element.id] = { ...element, count: 1 };
      } else {
        map[element.id].count++;
      }

      return map;
    }, {})
  );
};

module.exports = { generateCards, getUserInventoryCards };
