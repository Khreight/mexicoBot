const Discord = require("discord.js")

module.exports = {
    name: "ping",
    description: "Affiche la latence du bot",
    permission: "Aucune",
    dm: false,
    async run(bot, message) {
        await message.reply(`Voici mon ping actuel: \`${bot.ws.ping}\``)
    }
}