const Discord = require('discord.js');
const loadSlashCommands = require('../Loaders/loadSlashCommands');

module.exports = async bot => {
    await loadSlashCommands(bot);
    console.log(`${bot.user.tag} est bien en ligne!`);

    // Remplacez 'CHANNEL_ID' par l'ID du canal où vous voulez ajouter le bouton
    const channelId = '1274454777090277406';
    const channel = bot.channels.cache.get(channelId);

    if (!channel || !(channel instanceof Discord.TextChannel)) {
        console.error(`Le canal avec l'ID ${channelId} n'a pas été trouvé ou n'est pas un canal texte.`);
        return;
    }

    // Récupérez le dernier message du canal
    const messages = await channel.messages.fetch({ limit: 1 });
    const lastMessage = messages.first();

    if (!lastMessage) {
        console.error('Aucun message trouvé dans le canal.');
        return;
    }

    // Vérifiez si le bouton existe déjà
    const components = lastMessage.components;
    const buttonExists = components.some(row => 
        row.components.some(button => button.customId === 'ruleEnchere')
    );

    if (buttonExists) {
        console.log('Le bouton existe déjà.');
        return;
    }

    // Créez un bouton
    const button = new Discord.ButtonBuilder()
        .setCustomId('ruleEnchere')
        .setLabel("M'engager aux enchères")
        .setEmoji('✅')
        .setStyle(Discord.ButtonStyle.Success);

    // Ajoutez le bouton au message
    await lastMessage.edit({
        components: [
            new Discord.ActionRowBuilder().addComponents(button)
        ]
    });

    console.log('Le bouton a été ajouté au dernier message.');
};
