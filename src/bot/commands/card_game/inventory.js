const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserInventoryCards } = require("../../../game/game.js");
const rarities = require("../../../game/card/rarities.json");

const execute = async (interaction) => {
  const user = interaction.options.getUser("user") || interaction.user;

  const cards = getUserInventoryCards(user.id);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL(),
    })
    .setTitle("Inventory");

  if (cards.length === 0) {
    embed.setDescription("You have no cards");
  } else {
    embed.addFields(
      rarities
        .sort((a, b) => b.value - a.value)
        .map((rarity) => {
          const cardsByRarity = cards.filter(
            (card) => card.rarity === rarity.id
          );

          return {
            name: rarity.name,
            value: cardsByRarity
              .map((card) => `${card.name} (${card.count})`)
              .join("\n"),
            inline: true,
          };
        })
        .filter((field) => field.value.length > 0)
    );

    // for (rarity in rarities.sort((a, b) => b.value - a.value)) {
    //   const cardsByRarity = cards.filter(
    //     (card) => card.rarity === rarities[rarity].id
    //   );
    //   if (cardsByRarity.length > 0) {
    //     embed.addField(
    //       rarities[rarity].name,
    //       cardsByRarity
    //         .map((card) => `${card.name} (${card.count})`)
    //         .join("\n"),
    //       true
    //     );
    //   }
    // }
  }

  await interaction.reply({ embeds: [embed] });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("Shows users inventory of cards")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to show inventory for")
        .setRequired(false)
    ),
  execute: execute,
};
