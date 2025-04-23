const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');

const invitationDatabase = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addplayer')
    .setDescription('Invite multiple players to join your team')
    .addStringOption(option =>
      option.setName('team_name')
        .setDescription('Mention or type the name of the team role')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('player1')
        .setDescription('First player to invite')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('player2')
        .setDescription('Second player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player3')
        .setDescription('Third player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player4')
        .setDescription('Fourth player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player5')
        .setDescription('Fifth player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player6')
        .setDescription('Sixth player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player7')
        .setDescription('Seventh player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player8')
        .setDescription('Eighth player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player9')
        .setDescription('Ninth player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player10')
        .setDescription('Tenth player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player11')
        .setDescription('Eleventh player to invite')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('player12')
        .setDescription('Twelfth player to invite')
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

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('accept_addplayer').setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('decline_addplayer').setLabel('Decline').setStyle(ButtonStyle.Danger)
    );

    const success = [], failed = [], skipped = [];

    for (const player of players) {
      const guildMember = await interaction.guild.members.fetch(player.id);
      const alreadyInTeam = guildMember.roles.cache.some(role => role.id === teamRole.id);
      const existingInvite = invitationDatabase.get(player.id);

      if (alreadyInTeam || (existingInvite && existingInvite.team === teamRole.name)) {
        skipped.push(player.tag);
        continue;
      }

      try {
        const dm = await player.send({
          content: `You've been invited to join **${teamRole.name}** by ${interaction.user.tag}.`,
          components: [row]
        });

        invitationDatabase.set(player.id, { team: teamRole.name });
        success.push(player.tag);

        const collector = dm.createMessageComponentCollector();

        collector.on('collect', async i => {
          if (i.customId === 'accept_addplayer') {
            invitationDatabase.delete(player.id);
            const gm = await interaction.guild.members.fetch(player.id);
            await gm.roles.add(teamRole);
            await i.update({ content: `You’ve accepted the invite to **${teamRole.name}**.`, components: [] });
            await interaction.channel.send(`${player} has joined **${teamRole.name}**.`);

            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'server-logs');
            if (logChannel) {
              const logEmbed = new EmbedBuilder()
                .setTitle('Player Added')
                .addFields(
                  { name: 'Player', value: `<@${player.id}>`, inline: true },
                  { name: 'Team', value: teamRole.name, inline: true },
                  { name: 'Invited By', value: interaction.user.tag, inline: true }
                )
                .setColor('Green')
                .setTimestamp();
              logChannel.send({ embeds: [logEmbed] });
            }
          } else if (i.customId === 'decline_addplayer') {
            await i.update({ content: `You’ve declined the invite to **${teamRole.name}**.`, components: [] });
            await interaction.user.send(`${player.tag} declined the invite to join **${teamRole.name}**.`);
          }
        });
      } catch (err) {
        console.error(err);
        failed.push(player.tag);
      }
    }

    const finalReply = [
      success.length ? `✅ Invited: ${success.join(', ')}` : null,
      skipped.length ? `⚠️ Skipped (already in team or invited): ${skipped.join(', ')}` : null,
      failed.length ? `❌ Failed to DM: ${failed.join(', ')}` : null
    ].filter(Boolean).join('\n');

    await interaction.reply({ content: finalReply, ephemeral: true });
  }
};