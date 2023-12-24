const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { sendTradeRequest } = require("../../../game/game.js");

const execute = async (interaction) => {
  const userToTrade = interaction.options.getUser("user");
  const cardsToTrade = interaction.options.getString("cards").parseJSON();
  const cardsToReceive = interaction.options.getString("for").parseJSON();

  const embed = new EmbedBuilder();

  if (userToTrade.bot) {
    embed.setDescription("You can't trade with bots");
  } else if (userToTrade.id === interaction.user.id) {
    embed.setDescription("You can't trade with yourself");
  } else {
    const trade = sendTradeRequest(
      interaction.user.id,
      userToTrade.id,
      cardsToTrade,
      cardsToReceive
    );

    if (trade.success) {
      embed.addTitle("Trade sent successfully").addFields([
        {
          name: "You are trading away",
          value: cardsToTrade
            .map((card) => `${card.name} (${card.count})`)
            .join("\n"),
          inline: true,
        },
        {
          name: "You are trading for",
          value: cardsToReceive
            .map((card) => `${card.name} (${card.count})`)
            .join("\n"),
          inline: true,
        },
      ]);
    } else {
      embed
        .setTitle("Trade request unsuccessful")
        .setDescription(trade.message);
    }
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Trade cards with other users")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to trade with")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("away")
        .setDescription("Cards to trade away")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("for")
        .setDescription("Cards to trade for")
        .setRequired(true)
    ),
  execute: execute,
};
