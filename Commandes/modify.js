const Discord = require("discord.js");
const mysql = require("mysql2/promise");  // Utilisation de mysql2 avec promessese
const config = require('../config')

module.exports = {
    name: "modify",
    description: "Modifier votre pays dans la base de donnée",
    permission: "Aucune",
    dm: false,
    options: [
        {
            type: "string",
            name: "newcountry",
            description: "Votre nouveau pays",
            required: true
        }
    ],
    async run(bot, message) {
        // Récupérer les informations de l'utilisateur
        const userId = message.user.id;
        const newCountry = message.options.getString("newcountry");

        // Configuration de la connexion à la base de données
        const connection = await mysql.createConnection({
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database
        });

        try {
            // Mettre à jour le pays dans la base de données
            const query = `UPDATE utilisateur SET utilisateurPays = ? WHERE utilisateurIdDiscord = ?`;
            const [rows] = await connection.execute(query, [newCountry, userId]);

            if (rows.affectedRows > 0) {
                await message.reply({content: `Votre pays a été mis à jour avec succès en **${newCountry}**.`, ephemeral: true});
            } else {
                await message.reply({content: "Aucun enregistrement trouvé pour votre compte. Veuillez vous inscrire d'abord.", ephemeral: true});
            }
        } catch (error) {
            // Gérer les erreurs et envoyer un message d'erreur à l'utilisateur si nécessaire
            await message.reply({content: "Une erreur s'est produite lors de la mise à jour. Veuillez réessayer plus tard.", ephemeral: true});
        } finally {
            // Fermer la connexion à la base de données
            await connection.end();
        }
    }
};
