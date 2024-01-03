const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getUserInventory } = require("../../../game/game.js");

const execute = async (interaction) => {
  const user = interaction.options.getUser("user") || interaction.user;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL(),
    })
    .setTitle("Inventory");

  if (user.bot) {
    embed.setDescription("You can't view a bot's inventory!");

    return await interaction.reply({
      embeds: [embed],
    });
  }

  const cards = await getUserInventory(user.id);

  const cardsByRarity = cards.reduce((map, element) => {
    if (!map[element.rarity]) {
      map[element.rarity] = { value: element.rarity_value, cards: [element] };
    } else {
      map[element.rarity].cards.push(element);
    }

    return map;
  }, {});

  if (cards.length === 0) {
    embed.setDescription("No cards to display!");
  } else {
    embed.addFields(
      Object.values(cardsByRarity)
        .sort((a, b) => b.value - a.value)
        .map((rarity) => ({
          name: rarity.cards[0].rarity_name,
          value: rarity.cards
            .map((card) => `${card.name} (${card.count})`)
            .join("\n"),
          inline: true,
        }))
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
