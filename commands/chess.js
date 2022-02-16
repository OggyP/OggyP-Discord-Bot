var fs = require("fs");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
var mysql = require('mysql');
const { chessDatabase } = require('../config.json');

var con = mysql.createConnection({
    host: "localhost",
    database: "chess",
    user: chessDatabase.username,
    password: chessDatabase.password
});

con.connect(function(err) {
    if (err) throw err;
    console.log("MYSQL Connected!");
});

// format date function
function formatDate(timestamp) {
    let event = new Date(timestamp);
    let today = new Date();
    let yesterday = new Date(Date.now() - 864e5);

    let options = {
        weekday: "short",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit"
    };

    let date = event.toLocaleDateString(undefined, options).split(', ');
    let currentDate = today.toLocaleDateString(undefined, options).split(', ');
    let yesterDate = yesterday.toLocaleDateString(undefined, options).split(', ');

    let day;
    if (date[1] == currentDate[1]) {
        day = "Today";
    } else if (date[1] == yesterDate[1]) {
        day = "Yesterday";
    } else {
        day = "on " + date[0] + ", " + date[1];
    }

    return date[2] + " " + day;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chess')
        .setDescription('Get information from OggyP Chess!')
        .addSubcommand(subCommand =>
            subCommand.setName('game')
            .setDescription('Get the a chess game from a game ID')
            .addIntegerOption(option =>
                option.setName('id')
                .setDescription('The game ID of the OggyP Chess game')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand =>
            subCommand.setName('player')
            .setDescription('Get user information')
            .addStringOption(option =>
                option.setName('username')
                .setDescription('Player username')
                .setRequired(true))
        ),

    async execute(interaction) {
        await interaction.deferReply();
        if (interaction.options.getSubcommand() === 'player') {
            sendPlayerInfo(interaction.options.getString('username'), interaction)
        } else if (interaction.options.getSubcommand() === 'game') {
            sendGameInfo(interaction.options.getInteger('id'), interaction)
        }
    },
};

function sendGameInfo(gameId, interaction) {
    con.query("SELECT * FROM games WHERE id = " + mysql.escape(gameId), function(err, result) {
        if (result.length === 1) {
            let embed = new MessageEmbed()
                .setColor('#ffffff')
                .setTitle(result[0].white + ' vs ' + result[0].black + " | " + result[0].score + " | Stats")
                .setURL('https://chess.oggyp.com/?game=' + gameId)
                .setAuthor("OggyP Chess | Game Stats", 'https://chess.oggyp.com/resources/images/favicon.png', 'https://chess.oggyp.com/?game=' + gameId)
                .addFields({ name: "Mode", value: result[0].gameMode, inline: false }, { name: "White", value: result[0].white, inline: true }, { name: result[0].score, value: result[0].reason, inline: true }, { name: "Black", value: result[0].black, inline: true }, )
                .setTimestamp()
                .setFooter("https://chess.oggyp.com | Stats", 'https://chess.oggyp.com/resources/images/favicon.png');

            if (result[0].gameMode === "960") {
                embed.addFields({ name: "Starting FEN", value: result[0].startingPosition, inline: false }, )
            }

            embed.addFields({ name: "Opening", value: result[0].opening, inline: false }, { name: "Time of Game End", value: formatDate(result[0].createdAt), inline: false }, )

            fs.writeFile("game.pgn", result[0].pgn, (err) => {
                if (err) console.log(err);
                interaction.editReply({
                    embeds: [embed],
                    files: [{
                        attachment: './game.pgn',
                        name: 'game.pgn.txt'
                    }]
                });
            });
        } else {
            interaction.editReply("That game does not exist.")
        }
    });
}

function sendPlayerInfo(username, interaction) {
    con.query("SELECT * FROM users WHERE username = " + mysql.escape(username), function(err, result) {
        if (err) throw err;
        if (result.length === 1) {
            let rating = Math.round(result[0].wins / result[0].gamesPlayed * 100).toString()
            if (rating > 100) {
                rating = "Ewan Stop Cheating!!"
            } else {
                rating = rating.toString() + "%"
            }
            const embed = new MessageEmbed()
                .setColor('#ffffff')
                .setTitle(result[0].username + " | Stats")
                .setURL('https://chess.oggyp.com')
                .setAuthor("OggyP Chess | Player Stats", 'https://chess.oggyp.com/resources/images/favicon.png', 'https://chess.oggyp.com')
                .addFields({ name: "Rating", value: result[0].rating.toString(), inline: true }, { name: "Rating Deviation", value: result[0].ratingDeviation.toString(), inline: true }, { name: "Games Won Percent", value: rating, inline: false }, { name: "Games Played", value: result[0].gamesPlayed.toString(), inline: false }, { name: "Games Won", value: result[0].wins.toString(), inline: true }, { name: "Games Lost", value: (result[0].gamesPlayed - result[0].wins - result[0].draws).toString(), inline: true }, { name: "Games Drawn", value: result[0].draws.toString(), inline: true }, { name: "Sign up date", value: formatDate(result[0].createdAt), inline: false })
                .setTimestamp()
                .setFooter("https://chess.oggyp.com | Stats", 'https://chess.oggyp.com/resources/images/favicon.png');

            interaction.editReply({ embeds: [embed] });
        } else {
            interaction.editReply("That player does not exist.")
        }
    });

}