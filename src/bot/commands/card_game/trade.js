const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const {
  sendTradeRequest,
  acceptTradeRequest,
} = require("../../../game/game.js");

const execute = async (interaction) => {
  const userToTrade = interaction.options.getUser("user");

  const embed = new EmbedBuilder().setAuthor({
    name: interaction.member.displayName,
    iconURL: interaction.member.displayAvatarURL(),
  });

  if (userToTrade.bot) {
    embed.setDescription("You can't trade with bots");
  } else if (userToTrade.id === interaction.user.id) {
    embed.setDescription("You can't trade with yourself");
  } else {
    const cardsToTrade = JSON.parse(interaction.options.getString("away"));
    const cardsToReceive = JSON.parse(interaction.options.getString("for"));

    const trade = sendTradeRequest(
      interaction.user.id,
      userToTrade.id,
      cardsToTrade,
      cardsToReceive
    );

    if (trade.success) {
      embed.setTitle("Trade sent successfully").addFields([
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

      userToTrade.createDM().then(async (channel) => {
        const tradeRequestEmbed = new EmbedBuilder()
          .setAuthor({
            name: interaction.member.displayName,
            iconURL: interaction.member.displayAvatarURL(),
          })
          .setTitle(`Trade request from ${interaction.member.displayName}`)
          .addFields([
            {
              name: "You are trading away",
              value: cardsToReceive
                .map((card) => `${card.name} (${card.count})`)
                .join("\n"),
              inline: true,
            },
            {
              name: "You are trading for",
              value: cardsToTrade
                .map((card) => `${card.name} (${card.count})`)
                .join("\n"),
              inline: true,
            },
          ])
          .setFooter({ text: "✅ to accept, ❎ to decline" });
        const message = await channel.send({ embeds: [tradeRequestEmbed] });

        Promise.all([message.react("✅"), message.react("❎")]);

        message
          .awaitReactions({
            filter: (reaction) => ["✅", "❎"].includes(reaction.emoji.name),
            max: 1,
            time: 60000,
            errors: ["time"],
          })
          .then(async (collected) => {
            const reaction = collected.first();

            if (reaction.emoji.name === "✅") {
              const tradeResult = acceptTradeRequest(trade.id);

              if (tradeResult.success) {
                await message.edit(
                  new EmbedBuilder()
                    .setAuthor({
                      name: interaction.member.displayName,
                      iconURL: interaction.member.displayAvatarURL(),
                    })
                    .setTitle(
                      `Trade request from ${interaction.member.displayName}`
                    )
                    .setDescription("Trade accepted")
                );
              } else {
                await message.edit(
                  tradeRequestEmbed
                    .setDescription("Trade unsuceessful")
                    .addFields([
                      {
                        name: "Reason",
                        value: tradeResult.message,
                        inline: false,
                      },
                    ])
                );
              }
            } else {
              await message.edit(
                tradeRequestEmbed.setDescription("Trade declined")
              );
            }
          });
      });
    } else {
      embed
        .setTitle("Trade request unsuccessful")
        .setDescription(tradeResult.message);
    }
  }

  await interaction.reply({ embeds: [embed] });
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
