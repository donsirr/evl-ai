const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
    
    // Load each command
    for (const file of commandFiles) {
        const command = require(path.join(__dirname, '../commands', file));
        client.commands.set(command.data.name, command);
    }

    // Listen for commands
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error executing that command.', ephemeral: true });
        }
    });
};
