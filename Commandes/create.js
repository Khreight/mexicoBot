const Discord = require('discord.js');
const mysql = require('mysql2/promise'); // Utilisation de mysql2 avec promesses
const config = require('../config')

module.exports = {
    name: "create",
    description: "Créer une annonce pour vendre un objet",
    permission: "Aucune",
    dm: true,
    options: [
        {
            type: "string",
            name: "item",
            description: "Nom de l'objet à vendre",
            required: true
        },
        {
            type: "integer",
            name: "price",
            description: "Prix de départ de l'objet",
            required: true
        }
    ],
    async run(bot, interaction) {
        // Récupérer les informations de l'utilisateur
        const userIdDiscord = interaction.user.id;
        const userPseudo = interaction.user.username;
        const itemName = interaction.options.getString("item");
        const itemPrice = interaction.options.getInteger("price");

        // Vérifier si l'utilisateur a le bon rôle
        const allowedRoles = ['1267053759704469575', '1274301147053817888'];
        const member = interaction.guild.members.cache.get(userIdDiscord);

        if (!member || !allowedRoles.some(role => member.roles.cache.has(role))) {
            await interaction.reply({content: "Vous n'avez pas les autorisations nécessaires pour créer une annonce.", ephemeral: true});
            return;
        }

        // Configuration de la connexion à la base de données
        const connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database
        });

        try {
            // Rechercher l'ID utilisateur basé sur l'ID Discord
            const userQuery = 'SELECT utilisateurId FROM utilisateur WHERE utilisateurIdDiscord = ?';
            const [userRows] = await connection.execute(userQuery, [userIdDiscord]);

            if (userRows.length === 0) {
                await interaction.reply({content: "Utilisateur non trouvé dans la base de données.", ephemeral: true});
                return;
            }

            const utilisateurId = userRows[0].utilisateurId;

            // Insérer les données dans la table objet
            const insertQuery = 'INSERT INTO objet (objetName, objetPrixDepart, utilisateurId) VALUES (?, ?, ?)';
            const [result] = await connection.execute(insertQuery, [itemName, itemPrice, utilisateurId]);
            const objectId = result.insertId;

            // Récupérer les salons et le forum
            const announcementChannelId = '1273878546829545513';
            const forumId = '1273877880073617479';
            
            // Envoyer un message dans le salon spécifique
            const announcementChannel = interaction.guild.channels.cache.get(announcementChannelId);
            if (announcementChannel) {
                await announcementChannel.send(`**${itemName}** vient d'être rajouté aux enchères, organisé par <@${userIdDiscord}> (Enchère #${objectId})`);
            }

            // Créer un post dans le forum
            const forum = interaction.guild.channels.cache.get(forumId);
            if (forum) {
                const thread = await forum.threads.create({
                    name: `[EN COURS] Enchère #${objectId} - ${itemName}`,
                    autoArchiveDuration: Discord.ThreadAutoArchiveDuration.ThreeDays,
                    message: {
                        content: `Enchère #${objectId} organisée par <@${userIdDiscord}>`,
                    },
                    reason: 'Création d\'un post pour une nouvelle vente',
                });

                const postEmbed = new Discord.EmbedBuilder()
                    .setTitle(`Enchère #${objectId}`)
                    .setDescription(`**Item:** ${itemName}\n**Prix de départ**: ${itemPrice}\n**Annonce faite par**: <@${userIdDiscord}>`)
                    .setColor('#0099ff');

                // Envoyer un message dans le fil de discussion du forum
                const postMessage = await thread.send({
                    embeds: [postEmbed],
                    components: [
                        new Discord.ActionRowBuilder().addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`buycustom_${objectId}`)
                                .setEmoji("💰")
                                .setLabel('Surenchérir')
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setCustomId(`buyEnd_${objectId}`)
                                .setLabel("Valider l'enchère")
                                .setEmoji('✅')
                                .setStyle(Discord.ButtonStyle.Success),
                            new Discord.ButtonBuilder()
                                .setCustomId(`buyCancel_${objectId}`)
                                .setEmoji('✖️')
                                .setLabel("Annuler l'enchère (Uniquement si aucune proposition)")
                                .setStyle(Discord.ButtonStyle.Danger)
                        )
                    ]
                });
            }

            await interaction.reply({content: "Votre annonce a été créée avec succès !", ephemeral: true});
        } catch (error) {
            console.error(error);
            await interaction.reply({content: "Une erreur s'est produite lors de la création de l'annonce. Veuillez réessayer plus tard.", ephemeral: true});
        } finally {
            // Fermer la connexion à la base de données
            if (connection && connection.end) {
                await connection.end();
            }
        }
    }
};
