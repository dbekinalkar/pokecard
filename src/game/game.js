const dbManager = require("../db/dbManager.js");
const { getPackContents } = require("./card/pack.js");

const getUserPacks = async (id) => {
  const userPacks = await dbManager.getUserPacks(id);

  return userPacks;
};

const openPack = async (id, packId) => {
  const pack = await dbManager.getPack(packId);
  const packType = await dbManager.getPackType(pack.packType.id);

  const cardId = openPack(packType.weights);

  dbManager.openUserPacks(id, [packId], [cardId]);

  return generatedCards;
};

const openPacks = async (id, packs) => {
  const userPacks = await dbManager.getUserPacks(id, packs);
  const packsToOpen = Math.min(userPacks.length, packs);

  if (packsToOpen === 0) {
    return [[], 0];
  }

  if (packsToOpen < userPacks.length) {
    userPacks.splice(packsToOpen);
  }

  const packTypeMap = new Map();

  const cards = await Promise.all(
    userPacks.map(async (pack) => {
      if (!packTypeMap.has(pack.packType.id)) {
        const packData = await dbManager.getPackType(pack.packType.id);

        packTypeMap.set(pack.packType.id, packData);
      }
      return getPackContents(packTypeMap.get(pack.packType.id).rarities);
    })
  );

  await dbManager.openUserPacks(id, userPacks, cards);

  const cardsWithData = await Promise.all(
    cards.map(async (cardId) => await dbManager.getCardData(cardId))
  );

  return [cardsWithData, userPacks.length - packsToOpen];
};

const getUserInventory = (id) => {
  const inventory = dbManager.getUserInventory(id);

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

const sendTradeRequest = (
  initiatorId,
  recipientId,
  offeredCards,
  requestedCards
) => {
  if (cardsToTrade.length === 0 && cardsToReceive.length === 0) {
    return {
      success: false,
      message: "You must trade at least one card",
    };
  }

  const userCards = Object.values(
    dbManager.getUserInventory(initiatorId).reduce((map, element) => {
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

  const tradeId = dbManager.createTradeRequest(
    initiatorId,
    recipientId,
    offeredCards,
    requestedCards
  );

  return {
    success: true,
    message: "Trade sent successfully",
    id: tradeId,
  };
};

const acceptTradeRequest = (tradeId) => {
  const res = dbManager.acceptTrade(tradeId);

  switch (res) {
    case "Success":
      return {
        success: true,
        message: "Trade request accepted",
      };
    case "Trade_not_found":
      return {
        success: false,
        message: "Trade request not found",
      };
    case "Trade_not_pending":
      return {
        success: false,
        message: "Trade request not pending",
      };
    case "Trade_not_enough_cards":
      return {
        success: false,
        message: "Not enough cards to trade",
      };

    case "Error":
      return {
        success: false,
        message: "Error",
      };
  }

  return {
    success: false,
    message: "Error",
  };
};

module.exports = {
  getUserPacks,
  openPack,
  openPacks,
  getUserInventory,
  sendTradeRequest,
  acceptTradeRequest,
};
