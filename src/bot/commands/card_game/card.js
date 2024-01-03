const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { openPacks } = require("../../../game/game.js");

const execute = async (interaction) => {
  const packs = interaction.options.getInteger("packs") || 1;

  const res = await openPacks(interaction.user.id, packs);

  const [cards, packsLeft] = res;

  const embed = new EmbedBuilder()
    .setAuthor({
      name: interaction.member.displayName,
      iconURL: interaction.member.displayAvatarURL(),
    })
    .setFooter({ text: `You have ${packsLeft} packs left` });

  if (packs === 1) {
    embed
      .setTitle(
        `You unpacked a ${cards[0].rarity === "Rare Holo"? "Holo Rare ": ""}${
          cards[0].name
        }`
      )
      .setImage(cards[0].img);
  } else {
    embed.setTitle(`You unpacked ${packs} packs`).setDescription(
      Object.values(
        cards.reduce((map, element) => {
          if (!map[element.id]) {
            map[element.id] = { ...element, count: 1 };
          } else {
            map[element.id].count++;
          }

          return map;
        }, {})
      )
        .map(
          (card) =>
            `${card.rarity === "rare holo" && "Holo Rare "}${card.name} (${
              card.count
            })`
        )
        .join("\n")
    );
  }

  await interaction.reply({ embeds: [embed] });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("card")
    .setDescription("Opens a packs to give a cards")
    .addIntegerOption((option) =>
      option
        .setName("packs")
        .setDescription("How many packs to open")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    ),
  execute: execute,
};
