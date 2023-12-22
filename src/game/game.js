const { userPacks, userDeletePacks, addToInv } = require("../db/db.js");
const { openPack } = require("./card/pack.js");

const generateCards = (id, packs) => {
  packs = userPacks(id, packs);

  const cards = [];
  for (let i = 0; i < packs; i++) {
    cards.push(openPack());
  }

  addToInv(id, cards);

  packs = userDeletePacks(id, packs);

  return [cards, packs];
};

module.exports = { generateCards };
