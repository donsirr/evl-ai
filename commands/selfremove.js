const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('selfremove')
    .setDescription('Request to be removed from your current team.')
    .addStringOption(option =>
      option.setName('team_name')
        .setDescription('Mention or type the name of the team role')
        .setRequired(true)
    ),

  async execute(interaction) {
    const teamInput = interaction.options.getString('team_name');
    const member = await interaction.guild.members.fetch(interaction.user.id);

    // Parse role
    let teamRole;
    const mentionMatch = teamInput.match(/^<@&(\d+)>$/);
    if (mentionMatch) {
      teamRole = interaction.guild.roles.cache.get(mentionMatch[1]);
    } else {
      teamRole = interaction.guild.roles.cache.find(
        role => role.name.toLowerCase() === teamInput.toLowerCase()
      );
    }

    if (!teamRole) {
      return interaction.reply({
        content: `Team role "${teamInput}" not found.`,
        ephemeral: true,
      });
    }

    if (!member.roles.cache.has(teamRole.id)) {
      return interaction.reply({
        content: `You are not a part of the **${teamRole.name}** team.`,
        ephemeral: true,
      });
    }

    // Confirmation prompt
    const confirmRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_selfremove')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_selfremove')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      content: `Are you sure you want to leave **${teamRole.name}**?`,
      components: [confirmRow],
      ephemeral: true,
    });

    const collector = interaction.channel.createMessageComponentCollector({
      time: 15000,
      filter: i => i.user.id === interaction.user.id,
      max: 1,
    });

    collector.on('collect', async i => {
      if (i.customId === 'cancel_selfremove') {
        return i.update({ content: 'Canceled leaving the team.', components: [], ephemeral: true });
      }

      try {
        await member.roles.remove(teamRole);

        // Public message
        await interaction.channel.send(`${interaction.user} has left **${teamRole.name}**.`);

        // Log to #server-logs
        const logChannel = interaction.guild.channels.cache.find(
          ch => ch.name === 'server-logs' && ch.type === ChannelType.GuildText
        );
        if (logChannel) {
          logChannel.send(`${interaction.user.tag} left the team **${teamRole.name}**.`);
        }

        await i.update({
          content: `You have been successfully removed from **${teamRole.name}**.`,
          components: [],
        });

      } catch (err) {
        console.error(err);
        await i.update({
          content: `Failed to remove you from **${teamRole.name}**.`,
          components: [],
        });
      }
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          content: 'Timed out. No response received.',
          components: [],
        });
      }
    });
  },
};
