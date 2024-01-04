const { SlashCommandBuilder, EmbedBuilder, time } = require("discord.js");
const { getUserPacks } = require("../../../game/game.js");

const execute = async (interaction) => {
  const user = interaction.user;

  if (user.bot) {
    return;
  }

  const { packs, ...res } = await getUserPacks(user.id);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: interaction.member.displayName,
      iconURL: interaction.member.displayAvatarURL(),
    })
    .setTitle("Packs");

  if (packs.length === 0) {
    embed.setDescription("You have no packs to open!");
  } else {
    embed.setDescription(`You have ${packs.length} packs left`);
  }

  if (res.nextPackGenerationTime) {
    embed.setFields([
      {
        name: "Next free pack",
        value: `${time(res.nextPackGenerationTime.toDate(), "R")}`,
        inline: false,
      },
    ]);
  }

  await interaction.reply({ embeds: [embed] });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("packs")
    .setDescription("Returns the number of packs the user has"),
  execute: execute,
};
