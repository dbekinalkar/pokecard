const cards = require("./card_info.json");
const rarities = require("./rarities.json");

const openPack = () => {
  const max = rarities.reduce((sum, rarity) => sum + rarity.weight, 0);

  let random = Math.random() * max;

  const rarity = rarities.find((rarity) => {
    random -= rarity.weight;
    return random < 0;
  });

  const cardsByRarity = cards.filter(
    (card) => card.rarity.toLowerCase() === rarity.id.toLowerCase()
  );

  const card = cardsByRarity[Math.floor(Math.random() * cardsByRarity.length)];

  return card;
};

module.exports = { openPack };
