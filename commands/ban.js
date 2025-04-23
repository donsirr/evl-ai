const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const member = await interaction.guild.members.fetch(targetUser.id);
    if (!member.bannable) {
      return interaction.reply({
        content: 'I do not have permission to ban this user.',
        flags: MessageFlags.Ephemeral
      });
    }

    await member.ban({ reason });
    interaction.reply({
      content: `${targetUser.tag} has been banned for: ${reason}`,
      flags: MessageFlags.Ephemeral
    });

    // Log the ban in the server logs
    const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'server-logs');
    if (logChannel) {
      logChannel.send(`${targetUser.tag} was banned by ${interaction.user.tag} for: ${reason}`);
    }
  }
};
