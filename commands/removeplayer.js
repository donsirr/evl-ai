const {
  SlashCommandBuilder,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeplayer')
    .setDescription('Remove multiple players from your team')
    .addStringOption(option =>
      option.setName('team_name')
        .setDescription('Mention or type the name of the team role')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('player1')
        .setDescription('First player to remove')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('player2')
        .setDescription('Second player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player3')
        .setDescription('Third player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player4')
        .setDescription('Fourth player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player5')
        .setDescription('Fifth player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player6')
        .setDescription('Sixth player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player7')
        .setDescription('Seventh player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player8')
        .setDescription('Eighth player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player9')
        .setDescription('Ninth player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player10')
        .setDescription('Tenth player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player11')
        .setDescription('Eleventh player to remove')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player12')
        .setDescription('Twelfth player to remove')
        .setRequired(false)),

  async execute(interaction) {
    const teamName = interaction.options.getString('team_name');
    const players = [
      interaction.options.getUser('player1'),
      interaction.options.getUser('player2'),
      interaction.options.getUser('player3'),
      interaction.options.getUser('player4'),
      interaction.options.getUser('player5'),
      interaction.options.getUser('player6'),
      interaction.options.getUser('player7'),
      interaction.options.getUser('player8'),
      interaction.options.getUser('player9'),
      interaction.options.getUser('player10'),
      interaction.options.getUser('player11'),
      interaction.options.getUser('player12'),
    ].filter(Boolean); // Remove null values

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const captainRole = interaction.guild.roles.cache.find(role => role.name === 'Captain');

    if (!captainRole || member.roles.highest.position < captainRole.position) {
      return interaction.reply({
        content: 'You must be a Captain or higher to use this command.',
        flags: MessageFlags.Ephemeral
      });
    }

    let teamRole;
    try {
      if (teamName.startsWith('<@&')) {
        const roleId = teamName.replace(/[<@&>]/g, '');
        teamRole = interaction.guild.roles.cache.get(roleId);
      } else {
        teamRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === teamName.toLowerCase());
      }

      if (!teamRole) {
        return interaction.reply({
          content: `Team role "${teamName}" not found.`,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch (error) {
      return interaction.reply({
        content: 'Error fetching team role.',
        flags: MessageFlags.Ephemeral
      });
    }

    const invalidPlayers = [];
    const playersToRemove = [];

    for (const player of players) {
      const guildMember = await interaction.guild.members.fetch(player.id);
      const playerRole = guildMember.roles.cache.some(role => role.name === teamRole.name);

      if (!playerRole) {
        invalidPlayers.push(player.tag);
      } else {
        playersToRemove.push(player);
      }
    }

    if (invalidPlayers.length > 0) {
      return interaction.reply({
        content: `The following players are not in the team: ${invalidPlayers.join(', ')}.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Remove players and send notifications
    for (const player of playersToRemove) {
      try {
        const guildMember = await interaction.guild.members.fetch(player.id);
        await guildMember.roles.remove(teamRole);

        await interaction.channel.send(`${player} has been removed from **${teamRole.name}**.`);

        // Log the action
        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'server-logs');
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('Player Removed')
            .addFields(
              { name: 'Player', value: `<@${player.id}>`, inline: true },
              { name: 'Team', value: teamRole.name, inline: true },
              { name: 'Removed By', value: interaction.user.tag, inline: true }
            )
            .setColor('Red')
            .setTimestamp();
          logChannel.send({ embeds: [logEmbed] });
        }
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: `Failed to remove ${player.tag}.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }

    return interaction.reply({
      content: `Successfully removed ${playersToRemove.map(player => player.tag).join(', ')} from **${teamRole.name}**.`,
      flags: MessageFlags.Ephemeral
    });
  }
};
