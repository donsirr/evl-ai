// events/ready.js
module.exports = (client) => {
    client.once('ready', () => {
        console.log('Bot is now online!');
    });
};
