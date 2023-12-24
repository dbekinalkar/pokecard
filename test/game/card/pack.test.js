const mockedRarities = [
  { id: "1", weight: 50 },
  { id: "2", weight: 30 },
  { id: "3", weight: 20 },
];

const mockedCards = [
  { id: 1, name: "Mocked Card 1", rarity: "1" },
  { id: 2, name: "Mocked Card 2", rarity: "2" },
  { id: 3, name: "Mocked Card 3", rarity: "3" },
];

jest.mock("../../../src/game/card/rarities.json", () => mockedRarities);

jest.mock("../../../src/game/card/card_info.json", () => mockedCards);

const { openPack } = require("../../../src/game/card/pack");

describe("openPack", () => {
  it("should return a card", () => {
    const card = openPack();
    expect(card).toBeDefined();
    expect(card).toHaveProperty("id");
    expect(card).toHaveProperty("name");
    expect(card).toHaveProperty("rarity");
  });

  it("should return a card with the correct rarity", () => {
    const card = openPack();
    const rarity = mockedRarities.find((rarity) => rarity.id === card.rarity);
    expect(rarity).toBeDefined();
  });
});
