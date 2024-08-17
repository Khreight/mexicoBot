const Discord = require("discord.js");
const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mysql = require('mysql2/promise');
const intents = new Discord.IntentsBitField(3276799);
const bot = new Discord.Client({ intents });
const loadCommands = require("./Loaders/loadCommands");
const config = require("./config");
const loadEvents = require("./Loaders/loadEvents");

bot.commands = new Discord.Collection();



const colorMap = {
    // Couleurs de base
    "rouge": "#FF0000",
    "bleu": "#0000FF",
    "vert": "#00FF00",
    "jaune": "#FFFF00",
    "cyan": "#00FFFF",
    "magenta": "#FF00FF",
    "blanc": "#FFFFFF",
    "noir": "#000000",

    // Nuances de rouge
    "rouge clair": "#FF6666",
    "rouge foncé": "#8B0000",
    "rose": "#FFC0CB",
    "bordeaux": "#800020",
    "corail": "#FF7F50",

    // Nuances de bleu
    "bleu clair": "#ADD8E6",
    "bleu foncé": "#00008B",
    "azur": "#007FFF",
    "bleu ciel": "#87CEEB",
    "bleu nuit": "#191970",
    "turquoise": "#40E0D0",

    // Nuances de vert
    "vert clair": "#90EE90",
    "vert foncé": "#006400",
    "olive": "#808000",
    "vert lime": "#32CD32",
    "vert menthe": "#98FF98",

    // Nuances de jaune
    "jaune clair": "#FFFFE0",
    "or": "#FFD700",
    "jaune foncé": "#9ACD32",
    "moutarde": "#FFDB58",

    // Nuances de violet
    "violet": "#800080",
    "lavande": "#E6E6FA",
    "violet foncé": "#4B0082",
    "lilas": "#C8A2C8",
    "pourpre": "#A020F0",
    "améthyste": "#9966CC",

    // Nuances d'orange
    "orange": "#FFA500",
    "orange foncé": "#FF8C00",
    "saumon": "#FA8072",
    "abricot": "#FBCEB1",

    // Nuances de marron
    "marron": "#A52A2A",
    "brun": "#964B00",
    "chocolat": "#D2691E",
    "café": "#6F4E37",
    "caramel": "#C68E17",

    // Nuances de gris
    "gris clair": "#D3D3D3",
    "gris": "#808080",
    "gris foncé": "#A9A9A9",
    "anthracite": "#2F4F4F",
    "ardoise": "#708090",

    // Autres couleurs
    "bleu marine": "#000080",
    "bleu roi": "#4169E1",
    "indigo": "#4B0082",
    "cyan clair": "#E0FFFF",
    "bleu pétrole": "#4682B4",
    "beige": "#F5F5DC",
    "ivoire": "#FFFFF0",
    "crème": "#FFFDD0",
    "saumon clair": "#FFB6C1",
    "rose foncé": "#C71585",
    "vert sapin": "#228B22",
    "vert forêt": "#228B22",
    "vert olive": "#6B8E23",
    "sable": "#C2B280",
    "chamois": "#D2B48C",
    "argent": "#C0C0C0",
    "or clair": "#FFD700",
    "bronze": "#CD7F32",
    "cuivre": "#B87333",
    "framboise": "#E30B5D",
    "violet pastel": "#DA70D6",
    "bleu pastel": "#AEC6CF",
    "rose pastel": "#FFD1DC",
    "jaune pastel": "#FDFD96",
    "vert pastel": "#77DD77",
    "lavande clair": "#FBAED2"
    // Ajoute d'autres couleurs si nécessaire
};


bot.login(config.token);
loadCommands(bot);
loadEvents(bot);

const allowedGuildId = "1173697124882456578";
bot.on('guildCreate', guild => {
    if (guild.id !== allowedGuildId) {
        guild.leave();
    }
});

bot.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        if (interaction.commandName.startsWith("buycustom_")) {

            const modal = new ModalBuilder()
                .setCustomId('modalBuy')
                .setTitle('💰 - Surenchérir');

            const inputPrice = new TextInputBuilder()
                .setCustomId('inputPriceModal')
                .setLabel("Montant de proposition ?")
                .setStyle(TextInputStyle.Short);
            
            const firstActionRow = new ActionRowBuilder().addComponents(inputPrice);
            modal.addComponents(firstActionRow);
            await interaction.showModal(modal);
        }
    } else if (interaction.isButton()) {
        const objectId = interaction.customId.split('_')[1];
        const thread = await getThread(interaction.guild, objectId);

        const connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database
        });

        try {
            if (interaction.customId.startsWith("buycustom_")) {
                console.log('Button clicked:', interaction.customId);
                const modal = new ModalBuilder()
                    .setCustomId('modalBuy')
                    .setTitle('💰 - Surenchérir');
    
                const inputPrice = new TextInputBuilder()
                    .setCustomId('inputPriceModal')
                    .setLabel("Montant de proposition ?") // Réduit la longueur ici
                    .setStyle(TextInputStyle.Short);
                
                const firstActionRow = new ActionRowBuilder().addComponents(inputPrice);
                modal.addComponents(firstActionRow);
                await interaction.showModal(modal);
            } else if (interaction.customId.startsWith("buyEnd_")) {
                const ownerId = await getOwnerId(connection, objectId);
                const userTempId = await getSearchIdUser(connection, interaction.user.id);
                if (userTempId !== ownerId) {
                    await interaction.reply({ content: "Vous n'êtes pas autorisé à conclure cette enchère.", ephemeral: true });
                    return;
                }

                const [proposals] = await connection.execute('SELECT COUNT(*) AS count FROM proposition WHERE objetId = ?', [objectId]);
                if (proposals[0].count === 0) {
                    await interaction.reply({content: "Vous ne pouvez pas valider une enchère alors qu'il n'y a pas eu d'offre...", ephemeral: true})
                } else {
                    await thread.setLocked(true);
                    await thread.setName(`[CONCLU] - ${thread.name.split(' - ')[1]}`);

                    const [bestOfferRows] = await connection.execute('SELECT userId, propositionPrice FROM proposition WHERE objetId = ? ORDER BY propositionPrice DESC LIMIT 1', [objectId]);
                    if (bestOfferRows.length === 0) {
                        await interaction.reply({ content: "Erreur lors de la récupération de la meilleure offre.", ephemeral: true });
                        return;
                    }

                    const bestOfferUserId = bestOfferRows[0].userId;
                    let idUtilisateur = await getSearchIdUtilisateur(connection, bestOfferUserId)
                    const bestOfferPrice = bestOfferRows[0].propositionPrice;


                    const concludeEmbed = new EmbedBuilder()
                        .setTitle('**ENCHÈRE CONCLUE**')
                        .setDescription(`L'enchère est conclue ! Félicitations à <@${idUtilisateur}> pour avoir proposé **${bestOfferPrice}**€.`)
                        .setColor('#00ff00');
                    
                    await thread.send({ embeds: [concludeEmbed] });

                    interaction.reply({content: "L'enchère a bien été conclu ! Merci d'être passé par notre service.", ephemeral: true})
                }
            } else if (interaction.customId.startsWith("buyCancel_")) {
                const ownerId = await getOwnerId(connection, objectId);
                const userTempId = await getSearchIdUser(connection, interaction.user.id);
                if (userTempId !== ownerId) {
                    await interaction.reply({ content: "Vous n'êtes pas autorisé à conclure cette enchère.", ephemeral: true });
                    return;
                }

                const [proposals] = await connection.execute('SELECT COUNT(*) AS count FROM proposition WHERE objetId = ?', [objectId]);
                if (proposals[0].count != 0) {
                    await interaction.reply({ content: "Vous ne pouvez pas annuler l'enchère car des propositions ont été faites.", ephemeral: true });
                    return;
                }

                await thread.setLocked(true);
                await thread.setName(`[ANNULÉ] - ${thread.name.split(' - ')[1]}`);

                const cancelEmbed = new EmbedBuilder()
                    .setTitle('**ENCHÈRE ANNULÉE**')
                    .setDescription("Le propriétaire a décidé d'annuler l'enchère car aucune proposition n'a été faite.")
                    .setColor('#ff0000');
                
                await thread.send({ embeds: [cancelEmbed] });
                await interaction.reply({ content: "L'enchère a été annulée avec succès.", ephemeral: true });
            } else if (interaction.customId === 'ruleEnchere') {
                try {
                    const guild = interaction.guild;
                    const roleId = '1274454444716589057'; // Remplacez par l'ID du rôle que vous souhaitez attribuer
                    const userId = interaction.user.id;
                    
                    // Récupérez le membre
                    let member = guild.members.cache.get(userId);
                    if (!member) {
                        member = await guild.members.fetch(userId); // Cherchez le membre s'il n'est pas dans le cache
                    }
                    
                    if (!member) {
                        return interaction.reply({ content: "Impossible de trouver le membre.", ephemeral: true });
                    }
                    
                    // Récupérez le rôle
                    const role = guild.roles.cache.get(roleId);
                    if (!role) {
                        return interaction.reply({ content: "Le rôle n'a pas été trouvé.", ephemeral: true });
                    }
                    
                    // Vérifiez si le membre a déjà le rôle
                    if (member.roles.cache.has(roleId)) {
                        return interaction.reply({ content: "Vous avez déjà ce rôle.", ephemeral: true });
                    }
                    
                    // Ajoutez le rôle
                    await member.roles.add(role);

                    // Répondez à l'interaction
                    await interaction.reply({ content: "C'est parti pour les enchères !", ephemeral: true });
                } catch (error) {
                    console.error('Erreur lors de l\'attribution du rôle:', error);
                    await interaction.reply({ content: "Une erreur est survenue lors de l'attribution du rôle.", ephemeral: true });
                }
            }
        } catch (error) {
            console.error('Error handling auction:', error);
            await interaction.reply({ content: "Une erreur s'est produite lors du traitement de l'enchère. Veuillez réessayer plus tard.", ephemeral: true });
        } finally {
            if (connection && connection.end) {
                await connection.end();
            }
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'modalBuy') {
            const propositionPrice = interaction.fields.getTextInputValue('inputPriceModal');
            const buttonId = interaction.message.components[0].components.find(c => c.customId.startsWith('buycustom_')).customId;
            const objectId = buttonId.split('_')[1];
            const userIdDiscord = interaction.user.id;

            const connection = await mysql.createConnection({
                host: config.host,
                user: config.user,
                password: config.password,
                database: config.database
            });

            // Vérification si le montant est un nombre et supérieur à l'offre précédente
            if (!/^\d+$/.test(propositionPrice)) {
                await interaction.reply({ content: "Le montant proposé doit être un nombre entier.", ephemeral: true });
                return;
            }

            try {
                const [existingProposals] = await connection.execute('SELECT MAX(propositionPrice) AS maxPrice FROM proposition WHERE objetId = ?', [objectId]);
                const maxPrice = existingProposals[0].maxPrice;
                
                if (maxPrice !== null && parseInt(propositionPrice, 10) <= maxPrice) {
                    await interaction.reply({ content: "Votre proposition doit être strictement supérieure à l'offre actuelle.", ephemeral: true });
                    return;
                }
                

                const [userRows] = await connection.execute('SELECT utilisateurId FROM utilisateur WHERE utilisateurIdDiscord = ?', [userIdDiscord]);
                if (userRows.length === 0) {
                    await interaction.reply({ content: "Utilisateur non trouvé dans la base de données.", ephemeral: true });
                    return;
                }
                const userId = userRows[0].utilisateurId;

                // Insérer la proposition dans la base de données
                const insertQuery = 'INSERT INTO proposition (propositionPrice, objetId, userId) VALUES (?, ?, ?)';
                await connection.execute(insertQuery, [propositionPrice, objectId, userId]);

                // Envoyer un nouveau message dans le forum
                const forum = interaction.guild.channels.cache.get('1273877880073617479'); // ID du forum
                if (forum) {
                    const thread = await getThread(interaction.guild, objectId);
                    if (thread) {
                        const postEmbed = new EmbedBuilder()
                            .setTitle('**NOUVELLE OFFRE**')
                            .setDescription(`<@${interaction.user.id}> propose **${propositionPrice}**€`)
                            .setColor('#0099ff');
                        
                        // Envoyer un nouveau message dans le thread
                        await thread.send({ embeds: [postEmbed] });
                    }
                }

                await interaction.reply({ content: "Votre proposition a été enregistrée avec succès !", ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: "Une erreur s'est produite lors de l'enregistrement de votre proposition. Veuillez réessayer plus tard.", ephemeral: true });
            } finally {
                // Fermer la connexion à la base de données
                if (connection && connection.end) {
                    await connection.end();
                }
            }
        } else if(interaction.customId === 'embedModal') {
            const title = interaction.fields.getTextInputValue('titleInput');
            const description = interaction.fields.getTextInputValue('descriptionInput');
            const channelId = interaction.fields.getTextInputValue('channelInput');
            const colorName = interaction.fields.getTextInputValue('colorInput');
            const colorHex = getColorHex(colorName);

            const channel = await bot.channels.fetch(channelId);

                const embed = new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(description)
                    .setColor(colorHex)

                await channel.send({ embeds: [embed] });
                await interaction.reply({ content: 'Embed sent successfully!', ephemeral: true });
        }
    }
});

function getColorHex(colorName) {
    return colorMap[colorName.toLowerCase()] || "#FFFFFF"; // Valeur par défaut si la couleur n'est pas trouvée
}

async function getThread(guild, objectId) {
    const forum = guild.channels.cache.get('1273877880073617479'); // ID du forum
    if (forum) {
        return forum.threads.cache.find(t => t.name.includes(`Enchère #${objectId}`));
    }
    return null;
}

async function getOwnerId(connection, objectId) {
    const [rows] = await connection.execute('SELECT utilisateurId FROM objet WHERE objetId = ?', [objectId]);
    if (rows.length === 0) {
        throw new Error(`Aucun propriétaire trouvé pour l'objet avec ID ${objectId}`);
    }
    return rows[0].utilisateurId;
}

async function getSearchIdUser(connection, userId) {
    const [rows] = await connection.execute('SELECT utilisateurId FROM utilisateur WHERE utilisateurIdDiscord = ?', [userId]);
    if (rows.length === 0) {
        throw new Error(`Aucun propriétaire trouvé pour l'objet avec ID ${objectId}`);
    }
    return rows[0].utilisateurId;
}

async function getSearchIdUtilisateur(connection, userId) {
    const [rows] = await connection.execute('SELECT utilisateurIdDiscord FROM utilisateur WHERE utilisateurId = ?', [userId]);
    if (rows.length === 0) {
        throw new Error(`Aucune personne n'a été trouvée`);
    }
    return rows[0].utilisateurIdDiscord;
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', error => {
    console.error('Unhandled Rejection:', error);
});
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});
