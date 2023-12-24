const db = require("../db/db.js");
const { openPack } = require("./card/pack.js");

const generateCards = (id, packs) => {
  let packsToOpen = Math.min(db.getUserPacks(id, packs), packs);

  const cards = [];
  for (; packsToOpen > 0; packsToOpen--) {
    cards.push(openPack());
  }

  db.updateUserInventory(id, cards);

  const packsLeft = db.deleteUserPacks(id, packs);

  return [cards, packsLeft];
};

const getUserInventory = (id) => {
  const inventory = db.getUserInventory(id);

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
    db.getUserInventory(id).reduce((map, element) => {
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

  const tradeId = createTradeRequest(
    id,
    traderId,
    cardsToTrade,
    cardsToReceive
  );

  return {
    success: true,
    message: "Trade sent successfully",
    id: tradeId,
  };
};

const acceptTradeRequest = (tradeId) => {
  return {
    success: false,
    message: "Trade request not found",
  };
};

module.exports = {
  generateCards,
  getUserInventory,
  sendTradeRequest,
  acceptTradeRequest,
};
