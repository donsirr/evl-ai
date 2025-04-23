const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');

// Temporary in-memory "database"
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

    // Resolve team role either by mention or text
    let teamRole;
    let teamNameText = teamName; // This will be used in the DM
    try {
      if (teamName.startsWith('<@&')) {
        const roleId = teamName.replace(/[<@&>]/g, ''); // Extract the role ID from the mention
        teamRole = interaction.guild.roles.cache.get(roleId);
        teamNameText = teamRole ? teamRole.name : teamName; // Use role name in text
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
      console.error("Error fetching team role:", error);
      return interaction.reply({
        content: "There was an issue fetching the team role. Please try again later.",
        flags: MessageFlags.Ephemeral
      });
    }

    // Check if the players already have an invitation or are in a team
    const invalidPlayers = [];
    const playersToInvite = [];

    for (const player of players) {
      const guildMember = await interaction.guild.members.fetch(player.id);
      const playerRole = guildMember.roles.cache.some(role => role.name === teamRole.name);
      const existingInvitation = invitationDatabase.get(player.id);

      if (playerRole) {
        invalidPlayers.push(player.tag);
      } else if (existingInvitation && existingInvitation.team === teamRole.name) {
        invalidPlayers.push(player.tag);
      } else {
        playersToInvite.push(player);
      }
    }

    if (invalidPlayers.length > 0) {
      return interaction.reply({
        content: `The following players are already in a team or have an existing invitation: ${invalidPlayers.join(', ')}.`,
        flags: MessageFlags.Ephemeral
      });
    }

    // Send invitations to valid players
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('accept_addplayer').setLabel('Accept').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('decline_addplayer').setLabel('Decline').setStyle(ButtonStyle.Danger)
    );

    const confirmationMessages = []; // To store individual confirmation messages

    for (const player of playersToInvite) {
      try {
        // Set an invitation in the in-memory "database"
        invitationDatabase.set(player.id, { team: teamRole.name });

        const dm = await player.send({
          content: `You've been invited to join **${teamNameText}** by ${interaction.user.tag}.`,
          components: [row]
        });

        // Store confirmation message
        confirmationMessages.push(`${player.tag}: Invitation sent.`);

        const collector = dm.createMessageComponentCollector();

        collector.on('collect', async i => {
          if (i.customId === 'accept_addplayer') {
            // Remove existing invitation after acceptance
            invitationDatabase.delete(player.id);

            // Add the player to the team
            const guildMember = await interaction.guild.members.fetch(player.id);
            await guildMember.roles.add(teamRole);
            await i.update({ content: `You’ve accepted the invite to **${teamNameText}**.`, components: [] });

            // Send confirmation to the current channel (public message) with a proper mention of the player
            await interaction.channel.send(`${player} has joined **${teamNameText}**.`);

            // Log the action in the server logs
            const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'server-logs');
            if (logChannel) {
              const logEmbed = new EmbedBuilder()
                .setTitle('Player Added')
                .addFields(
                  { name: 'Player', value: `<@${player.id}>`, inline: true },
                  { name: 'Team', value: teamNameText, inline: true },
                  { name: 'Invited By', value: interaction.user.tag, inline: true }
                )
                .setColor('Green')
                .setTimestamp();

              logChannel.send({ embeds: [logEmbed] });
            }
          } else if (i.customId === 'decline_addplayer') {
            await i.update({ content: `You’ve declined the invite to **${teamNameText}**.`, components: [] });
            await interaction.user.send(`${player.tag} declined the invite to join **${teamNameText}**.`);
          }
        });

      } catch (err) {
        console.error(err);
        await interaction.reply({
          content: `Failed to DM ${player.tag}.`,
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // Send all confirmation messages at once
    await interaction.reply({
      content: confirmationMessages.join('\n'),
      flags: MessageFlags.Ephemeral
    });
  }
};
