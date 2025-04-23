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
    const players = Array.from({ length: 12 }, (_, i) =>
      interaction.options.getUser(`player${i + 1}`)
    ).filter(Boolean);

    const member = await interaction.guild.members.fetch(interaction.user.id);
    const captainRole = interaction.guild.roles.cache.find(role => role.name === 'Captain');
    if (!captainRole || member.roles.highest.position < captainRole.position) {
      return interaction.reply({ content: 'You must be a Captain or higher to use this command.', ephemeral: true });
    }

    let teamRole;
    if (teamName.startsWith('<@&')) {
      const roleId = teamName.replace(/[<@&>]/g, '');
      teamRole = interaction.guild.roles.cache.get(roleId);
    } else {
      teamRole = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === teamName.toLowerCase());
    }

    if (!teamRole) {
      return interaction.reply({ content: `Team role "${teamName}" not found.`, ephemeral: true });
    }

    const removed = [], skipped = [];

    for (const player of players) {
      const guildMember = await interaction.guild.members.fetch(player.id);
      const hasRole = guildMember.roles.cache.has(teamRole.id);

      if (!hasRole) {
        skipped.push(player.tag);
        continue;
      }

      await guildMember.roles.remove(teamRole);
      removed.push(player.tag);
      await interaction.channel.send(`${player} has been removed from **${teamRole.name}**.`);

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
    }

    const reply = [
      removed.length ? `✅ Removed: ${removed.join(', ')}` : null,
      skipped.length ? `⚠️ Skipped (not in team): ${skipped.join(', ')}` : null
    ].filter(Boolean).join('\n');

    await interaction.reply({ content: reply, ephemeral: true });
  }
};