module.exports = {
  getUserPacks: (id) => 10,
  deleteUserPacks: (id, packs) => 10 - packs,
  updateUserInventory: (id, cards) => cards,
  getUserInventory: (id) => [
    {
      id: 0,
      name: "test",
      rarity: "rare holo",
    },
    {
      id: 0,
      name: "test",
      rarity: "rare holo",
    },
    {
      id: 1,
      name: "test",
      rarity: "common",
    },
  ],
};
