const { db, FieldValue, Timestamp } = require("./firebaseConfig.js");

const packGenerationTime = 600; // 10 minutes in seconds

const initUser = async (id) => {
  const userRef = db.collection("users").doc(id);
  const [packs, batch] = createPacks(id, 10, "default");

  const defaultUser = {
    inventory: [],
    packs: packs,
    lastPackGenerationTime: Timestamp.now(),
  };

  batch.set(userRef, defaultUser);

  await batch.commit();

  return userRef;
};

const createPacks = (id, count, packType) => {
  console.log("Creating packs", id, count, packType);
  console.trace();
  const userRef = db.collection("users").doc(id);
  const packTypeRef = db.collection("packtypes").doc(packType || "default");
  const packs = [];
  const batch = db.batch();

  for (let i = 0; i < count; i++) {
    const packRef = db.collection("packs").doc();
    packs.push(packRef);
    batch.set(packRef, {
      owner: userRef,
      packType: packTypeRef,
      opened: false,
    });
  }

  return [packs, batch];
};

const generateFreePacks = async (id) => {
  try {
    const res = await db.runTransaction(async (t) => {
      const userRef = db.collection("users").doc(id);
      const userSnapshot = await userRef.get();
      if (!userSnapshot.exists) {
        await initUser(id);
        return 10;
      }

      const user = userRef.data();
      const lastPackGenerationTime = user.lastPackGenerationTime;
      const now = Timestamp.now();
      const diff = now.seconds - lastPackGenerationTime.seconds;
      const currentPackCount = user.packs.length;
      let packsToAdd = Math.floor(diff / packGenerationTime);

      if (packsToAdd <= 0) {
        return 0;
      }

      if (currentPackCount > 10) {
        user.set({ lastPackGenerationTime: now });
      }

      if (currentPackCount + packsToAdd > 10) {
        packsToAdd = 10 - currentPackCount;
      }

      const [packs, batch] = createPacks(id, packsToAdd);
      const newLastPackGenerationTime = new Timestamp(
        lastPackGenerationTime.seconds + packsToAdd * packGenerationTime,
        lastPackGenerationTime.nanoseconds
      );
      batch.update(userRef, {
        packs: FieldValue.arrayUnion(...packs),
        lastPackGenerationTime: newLastPackGenerationTime,
      });

      await batch.commit();
    });
  } catch (e) {}
};

const createCards = (id, cards, batch) => {
  const userRef = db.collection("users").doc(id);

  const generatedCards = cards.map((card) => {
    const cardRef = db.collection("cards").doc();
    batch.set(cardRef, { id: card, owner: userRef });
    return cardRef;
  });

  return generatedCards;
};

const getPack = async (packId) => {
  const packRef = db.collection("packs").doc(packId);
  const pack = await packRef.get();
  return pack.data();
};

const getUserPacks = async (id) => {
  await generateFreePacks(id);
  const userRef = db.collection("users").doc(id);
  const user = await userRef.get();
  const packs = user.data().packs;

  const packTypeMap = new Map();
  const packsWithData = await Promise.all(
    packs.map(async (pack) => {
      const packData = (await pack.get()).data();

      const packTypeId = packData.packType.id;

      if (!packTypeMap.has(packTypeId)) {
        packTypeMap.set(packTypeId, {
          ...(await packData.packType.get()).data(),
          id: packTypeId,
        });
      }
      return {
        ...packData,
        packType: packTypeMap.get(packTypeId),
        id: pack.id,
      };
    })
  );

  return packsWithData;
};

const getPackType = async (packTypeId) => {
  const packTypeRef = db.collection("packtypes").doc(packTypeId);
  const [packType, rarities] = await Promise.all([
    packTypeRef.get(),
    packTypeRef.collection("rarities").get(),
  ]);

  return {
    ...packType.data(),
    rarities: rarities.docs.map((rarity) => rarity.data()),
  };
};

const openUserPacks = async (id, packs, cards) => {
  generateFreePacks(id);

  const userRef = db.collection("users").doc(id);

  const packRefs = packs.map((pack) => db.collection("packs").doc(pack.id));

  const batch = db.batch();

  const generatedCards = createCards(id, cards, batch);

  packRefs.forEach((packRef) => {
    batch.update(packRef, { opened: true });
  });

  batch.update(userRef, {
    packs: FieldValue.arrayRemove(...packRefs),
    inventory: FieldValue.arrayUnion(...generatedCards),
  });

  await batch.commit();
};

const getCardData = async (cardDataId) => {
  const cardDataRef = db.collection("carddata").doc(cardDataId);
  const cardData = await cardDataRef.get();

  return cardData.data();
};

const getUserInventory = async (id) => {
  const userRef = db.collection("users").doc(id);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists) {
    await initUser(id);
    return [];
  }

  const inventory = userSnapshot.data().inventory;

  const cards = await Promise.all(inventory.map((card) => card.get()));

  const cardDataMap = new Map();
  const cardsWithData = await Promise.all(
    cards.map(async (card) => {
      const cardDataId = card.data().id;
      if (!cardDataMap.has(cardDataId)) {
        cardDataMap.set(cardDataId, await getCardData(cardDataId));
      }
      return {
        ...card.data(),
        cardData: cardDataMap.get(cardDataId),
        id: card.id,
      };
    })
  );

  return cardsWithData;
};

const createTrade = async (
  initiatorId,
  recipientId,
  offeredCards,
  requestedCards
) => {
  const tradeRef = db.collection("trades").doc();
  await tradeRef.set({
    initiator: db.collection("users").doc(initiatorId),
    recipient: db.collection("users").doc(recipientId),
    offeredCards: offeredCards,
    requestedCards: requestedCards,
    status: "pending",
    completionTime: null,
  });
  return tradeRef.id;
};

const getTrade = async (tradeId) => {
  const tradeRef = db.collection("trades").doc(tradeId);
  const trade = await tradeRef.get();
  return trade.data();
};

const convertCardsToRefs = async (cards, inventory) => {
  const cardMap = new Map();

  inventory.forEach((card) => {
    if (!cardMap.has(card.cardData.id)) {
      cardMap.set(card.cardData.id, [card]);
    }
    cardMap.get(card.cardData.id).push(card);
  });

  cards.forEach((card) => {
    const cardRef = cardMap.get(card.cardData.id).pop();
    if (!cardRef) {
      throw new Error("Not enough cards to trade");
    }
    cardRefs.push(cardRef);
  });

  return cardRefs;
};

const acceptTrade = async (tradeId) => {
  try {
    const res = await db.runTransaction(async (t) => {
      const tradeRef = db.collection("trades").doc(tradeId);
      const trade = await tradeRef.get();
      const tradeData = trade.data();

      if (!trade.exists) {
        return "Trade_not_found";
      }

      if (tradeData.status !== "pending") {
        return "Trade_not_pending";
      }

      const initiatorRef = traderData.initiator;
      const recipientRef = traderData.recipient;

      const initiatorInventory = await getUserInventory(initiatorRef.id);
      const recipientInventory = await getUserInventory(recipientRef.id);

      const batch = db.batch();

      batch.update(tradeRef, {
        status: "accepted",
        completionTime: Timestamp.now(),
      });

      const offeredCards = convertCardsToRefs(
        tradeData.offeredCards,
        initiatorInventory
      );

      const requestedCards = convertCardsToRefs(
        tradeData.requestedCards,
        recipientInventory
      );

      batch.update(initiatorRef, {
        inventory: FieldValue.arrayRemove(...offeredCards),
        inventory: FieldValue.arrayUnion(...requestedCards),
      });

      batch.update(recipientRef, {
        inventory: FieldValue.arrayRemove(...requestedCards),
        inventory: FieldValue.arrayUnion(...offeredCards),
      });

      await batch.commit();

      return "Success";
    });
  } catch (e) {
    if (e.message === "Not enough cards to trade") {
      return "Trade_not_enough_cards";
    }
    return "Error";
  }

  return res;
};

module.exports = {
  packGenerationTime,
  initUser,
  createPacks,
  generateFreePacks,
  createCards,
  getPack,
  getUserPacks,
  getPackType,
  getCardData,
  openUserPacks,
  getUserInventory,
  convertCardsToRefs,
  createTrade,
  getTrade,
  acceptTrade,
};
