const Discord = require('discord.js')
const { Client, GatewayIntentBits, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    name: "embed",
    description: "Créer un embed personnalisé",
    permission: Discord.PermissionFlagsBits.Administrator,
    dm: false,

    async run(bot, interaction) {
        const modal = new ModalBuilder()
            .setCustomId('embedModal')
            .setTitle('Create an Embed');

        // Création des champs
        const titleInput = new TextInputBuilder()
            .setCustomId('titleInput')
            .setLabel('Title')
            .setStyle(TextInputStyle.Short);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('descriptionInput')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph);

        const channelInput = new TextInputBuilder()
            .setCustomId('channelInput')
            .setLabel('Channel ID')
            .setStyle(TextInputStyle.Short);

        const colorInput = new TextInputBuilder()
            .setCustomId('colorInput')
            .setLabel('Color (e.g., rouge, bleu)')
            .setStyle(TextInputStyle.Short);

        // Création des lignes d'action
        const firstActionRow = new ActionRowBuilder().addComponents(titleInput);
        const secondActionRow = new ActionRowBuilder().addComponents(descriptionInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(channelInput);
        const fourthActionRow = new ActionRowBuilder().addComponents(colorInput);

        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow);
        await interaction.showModal(modal);
    }
}