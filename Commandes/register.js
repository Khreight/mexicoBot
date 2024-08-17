const Discord = require("discord.js");
const mysql = require("mysql2/promise");  // Utilisation de mysql2 avec promesses
const config = require('../config')

module.exports = {
    name: "register",
    description: "S'inscrire dans la base de donnée du pays",
    permission: "Aucune",
    dm: false,
    options: [
        {
            type: "string",
            name: "country",
            description: "Votre pays",
            required: true
        }
    ],
    async run(bot, message) {
        // Récupérer les informations de l'utilisateur
        const userId = message.user.id;
        const userPseudo = message.user.username;
        const userCountry = message.options.getString("country");
        
        // Configuration de la connexion à la base de données
        const connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database
        });

        try {
            // Vérifier si le pseudo est déjà enregistré
            const checkQuery = 'SELECT * FROM utilisateur WHERE utilisateurPseudo = ?';
            const [rows] = await connection.execute(checkQuery, [userPseudo]);

            if (rows.length > 0) {
                // Si le pseudo est déjà enregistré
                await message.reply({content: "Vous êtes déjà enregistré dans la base de données.", ephemeral: true});
                return;
            }

            // Insérer les données dans la base de données
            const insertQuery = 'INSERT INTO utilisateur (utilisateurPseudo, utilisateurIdDiscord, utilisateurPays) VALUES (?, ?, ?)';
            await connection.execute(insertQuery, [userPseudo, userId, userCountry]);

            // Récupérer le rôle et le salon
            const roleId = '1267053759704469575';
            const channelId = '1267049788432453642';
            const tempRoleId = '1274314586694357053';

            // Ajouter le rôle à l'utilisateur
            const guild = message.guild;
            const member = guild.members.cache.get(userId);
            const role = guild.roles.cache.get(roleId);

            if (role && member) {
                await member.roles.add(role);
            }

            if (tempRoleId && member) {
                await member.roles.remove(tempRoleId);
            }
            
            // Envoyer un message dans le salon spécifique
            const channel = guild.channels.cache.get(channelId);
            if (channel) {
                await channel.send(`<@${message.user.id}> a été enregistré dans la base de données et donc a été autorisé au Mexique.`);
                await message.reply({content: "Vous avez bien été enregistré dans notre base de données, bienvenue au Mexique !", ephemeral: true});
            }
        } catch (error) {
            await message.reply({content: "Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer plus tard.", ephemeral: true});
        } finally {
            // Fermer la connexion à la base de données
            await connection.end();
        }
    }
};
