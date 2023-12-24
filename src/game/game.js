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
  for (; packsToOpen > 0; packsToOpen--) {
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

const sendTradeRequest = (id, traderId, cardsToTrade, cardsToReceive) => {
  if (cardsToTrade.length === 0 && cardsToReceive.length === 0) {
    return {
      success: false,
      message: "You must trade at least one card",
    };
  }

  const userCards = Object.values(
    getUserInventory(id).reduce((map, element) => {
      if (!map[element.id]) {
        map[element.id] = { ...element, count: 1 };
      } else {
        map[element.id].count++;
      }

      return map;
    }, {})
  );

  for (card of cardsToReceive) {
    const userCard = userCards.find((c) => c.id === card.id);

    if (!userCard || userCard.count < card.count) {
      return {
        success: false,
        message: "You don't have the cards you are trading away",
      };
    }
  }

  const traderCards = Object.values(
    traderCards(traderId).reduce((map, element) => {
      if (!map[element.id]) {
        map[element.id] = { ...element, count: 1 };
      } else {
        map[element.id].count++;
      }

      return map;
    }, {})
  );

  for (card of cardsToTrade) {
    const traderCard = traderCards.find((c) => c.id === card.id);

    if (!traderCard || traderCard.count < card.count) {
      return {
        success: false,
        message: "You don't have the cards you are trading for",
      };
    }
  }

  return {
    success: true,
    message: "Trade sent successfully",
  };
};

module.exports = { generateCards, getUserInventoryCards, sendTradeRequest };
