const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(targetUser.id);
    if (!member.kickable) {
      return interaction.reply({
        content: 'I do not have permission to kick this user.',
        flags: MessageFlags.Ephemeral
      });
    }

    await member.kick(reason);
    interaction.reply({
      content: `${targetUser.tag} has been kicked for: ${reason}`,
      flags: MessageFlags.Ephemeral
    });

    // Log the kick in the server logs
    const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'server-logs');
    if (logChannel) {
      logChannel.send(`${targetUser.tag} was kicked by ${interaction.user.tag} for: ${reason}`);
    }
  }
};
