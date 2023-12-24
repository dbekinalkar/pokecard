const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserInventory } = require("../../../game/game.js");
const rarities = require("../../../game/card/rarities.json");

const execute = async (interaction) => {
  const user = interaction.options.getUser("user") || interaction.user;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL(),
    })
    .setTitle("Inventory");

  if (user.bot) {
    return await interaction.reply({
      embeds: [embed.setDescription("You can't view a bot's inventory!")],
    });
  }

  const cards = getUserInventory(user.id);

  if (cards.length === 0) {
    embed.setDescription("No cards to display!");
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
            inline: false,
          };
        })
        .filter((field) => field.value.length > 0)
    );
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
