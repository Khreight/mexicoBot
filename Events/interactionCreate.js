const { InteractionType } = require('discord.js');

module.exports = async (bot, interaction) => {
    if (interaction.type === InteractionType.ApplicationCommand) {
        let command;
        try {
            command = require(`../Commandes/${interaction.commandName}`);
        } catch (error) {
            console.error(`Command file not found for ${interaction.commandName}`);
            return;
        }

        if (command && typeof command.run === 'function') {
            command.run(bot, interaction, command.options);
        } else {
            console.error(`Command run method missing or invalid for ${interaction.commandName}`);
        }
    } else if (interaction.type === InteractionType.MessageComponent) {
        // Pour les interactions de boutons ou autres composants
        if (interaction.isButton()) {
            // Optionnel : gérer les interactions de boutons ici si nécessaire
            console.log('Button interaction:', interaction.customId);
            // Logique spécifique pour les boutons
        }
    }
};
