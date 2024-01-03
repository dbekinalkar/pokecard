const getPackContents = (rarityWeights) => {
  const max = rarityWeights.reduce((sum, rarity) => sum + rarity.weight, 0);

  let random = Math.random() * max;

  const rarity = rarityWeights.find((rarity) => {
    random -= rarity.weight;
    return random < 0;
  });

  const cardId =
    rarity.cardIds[Math.floor(Math.random() * rarity.cardIds.length)];

  return cardId;
};

module.exports = { getPackContents };
