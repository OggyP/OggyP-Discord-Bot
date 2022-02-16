const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
var mysql = require('mysql');
const { snakeDatabase } = require('../config.json');

var con = mysql.createConnection({
    host: "localhost",
    database: "snake",
    user: snakeDatabase.username,
    password: snakeDatabase.password,
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
        .setName('snake')
        .setDescription('Get information from OggyP Snake!')
        .addSubcommand(subCommand =>
            subCommand.setName('rank')
            .setDescription('Get the best players')
            .addStringOption(option =>
                option.setName('mode')
                .setDescription('The OggyP Snake rated mode')
                .addChoice('2 Player', '2')
                .addChoice('3 Player', '3')
                .setRequired(true)
            )
            // .addStringOption(option =>
            //     option.setName('order')
            //         .setDescription('If you want the best or worst players.')
            //         .addChoice('Top', 'top')
            //         .addChoice('Bottom', 'bottom')
            //         .setRequired(false)
            //     )
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
            con.query("SELECT * FROM users WHERE username = " + mysql.escape(interaction.options.getString('username')), function(err, result) {
                if (err) throw err;
                if (result.length === 1) {
                    if (result[0].title !== "") {
                        sendPlayerInfo("__**" + result[0].title + "**__ " + result[0].username, result[0].rating2.toString(), result[0].rd2.toString(), result[0].rating3.toString(), formatDate(result[0].created_at.getTime()), interaction)
                    } else {
                        sendPlayerInfo(result[0].username, result[0].rating2.toString(), result[0].rd2.toString(), result[0].rating3.toString(), formatDate(result[0].created_at.getTime()), interaction)
                    }
                } else {
                    interaction.editReply("That player does not exist.")
                }
            });
        } else if (interaction.options.getSubcommand() === 'rank') {
            if (interaction.options.getString('mode') === '2') {
                con.query("select * from users order by rating2 desc", function(err, result) {
                    if (err) throw err;
                    if (result.length > 3) {
                        let message = [];
                        message.push("**2 Player Rated**")
                        let playersSent = 0;
                        var players = []
                        for (let i = 0; playersSent < 3; i++) {
                            if (result[i].rd2 < 200) {
                                playersSent++;
                                // if (result[i].title !== "") {
                                //     message.push("__**" + result[i].title + "**__ " + result[i].username + ": " + result[i].rating2 + "|" + result[i].rd2)
                                // } else {
                                //     message.push(result[i].username + ": " + result[i].rating2 + "|" + result[i].rd2)
                                // }
                                if (result[i].title !== "") {
                                    players.push(["__**" + result[i].title + "**__ " + result[i].username, result[i].rating2 + " | " + result[i].rd2])
                                } else {
                                    players.push([result[i].username, result[i].rating2 + " | " + result[i].rd2])
                                }
                            }
                        }
                        sendLeaderBoard("2 Player Rated", players[0], players[1], players[2], interaction)
                    } else {
                        interaction.editReply("Error fetching top players.")
                    }
                });
            } else if (interaction.options.getString('mode') === '3') {
                con.query("select * from users order by rating3 desc", function(err, result) {
                    if (err) throw err;
                    if (result.length > 3) {
                        let players = [];
                        for (let i = 0; i < 3; i++) {
                            if (result[i].title !== "") {
                                players.push(["__**" + result[i].title + "**__ " + result[i].username, result[i].rating3.toString()])
                            } else {
                                players.push([result[i].username, result[i].rating3.toString()])
                            }
                        }
                        console.log(players)
                        sendLeaderBoard("3 Player Rated", players[0], players[1], players[2], interaction)
                    } else {
                        interaction.editReply("Error fetching top players.")
                    }
                });
            }
        }
    },
};

function sendLeaderBoard(title, player1, player2, player3, interaction) {
    const exampleEmbed = new MessageEmbed()
        .setColor('#ff0000')
        .setTitle(title)
        .setURL('https://snake.oggyp.com')
        .setAuthor("OggyP Snake | Leaderboards", 'https://snake.oggyp.com/resources/images/OSI.png', 'https://snake.oggyp.com')
        .addFields({ name: '1st | ' + player1[0], value: player1[1], inline: false }, { name: '2nd | ' + player2[0], value: player2[1], inline: false }, { name: '3rd | ' + player3[0], value: player3[1], inline: false }, )
        .setTimestamp()
        .setFooter("https://snake.oggyp.com | Leaderboards", 'https://snake.oggyp.com/resources/images/OSI.png');

    interaction.editReply({ embeds: [exampleEmbed] });
}

function sendPlayerInfo(username, playerRating2, RD2, playerRating3, signUpDate, interaction) {
    const exampleEmbed = new MessageEmbed()
        .setColor('#ff0000')
        .setTitle(username + " | Stats")
        .setURL('https://snake.oggyp.com')
        .setAuthor("OggyP Snake | Player Stats", 'https://snake.oggyp.com/resources/images/OSI.png', 'https://snake.oggyp.com')
        .addFields({ name: "2 Player Rating", value: playerRating2, inline: true }, { name: "2 Player Deviation", value: RD2, inline: true }, { name: "3 Player Rating", value: playerRating3, inline: false }, { name: "Sign up date", value: signUpDate, inline: false }, )
        .setTimestamp()
        .setFooter("https://snake.oggyp.com | Stats", 'https://snake.oggyp.com/resources/images/OSI.png');

    interaction.editReply({ embeds: [exampleEmbed] });
}