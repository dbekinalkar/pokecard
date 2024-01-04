const mockedRarities = [
  { id: "1", weight: 50, cards: ["1", "2", "3"] },
  { id: "2", weight: 30, cards: ["4", "5"] },
  { id: "3", weight: 20, cards: ["6"] },
];

const { getPackContents } = require("../../../src/game/card/pack");

describe("getPackContents", () => {
  it("should return a card", () => {
    const cardId = getPackContents(mockedRarities);
    expect(cardId).toBeDefined();
    expect(["1", "2", "3", "4", "5", "6"]).toContain(cardId);
  });

  it("should return a card with the correct rarity", () => {
    const cardId = getPackContents(mockedRarities);
    const rarity = mockedRarities.find((rarity) =>
      rarity.cards.includes(cardId)
    );
    expect(rarity).toBeDefined();
  });
});
