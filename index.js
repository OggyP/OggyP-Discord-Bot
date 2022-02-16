const fs = require('fs');
// Require the necessary discord.js classes
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, Collection, Intents } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const schedule = require('node-schedule');
const timetableFile = require(`./commands/timetable.js`);

const commands = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(token);

// (async () => {
// 	try {
// 		await rest.put(
// 			Routes.applicationCommands(clientId, guildId),
// 			{ body: commands },
// 		);

// 		console.log('Successfully registered application commands.');
// 	} catch (error) {
// 		console.error(error);
// 	}
// })();

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, "GUILDS", "GUILD_MESSAGES"] })
client.commands = new Collection();

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.data.name, command);
}

// When the client is ready, run this code (only once)
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    timetableFile.genStatus().then(newStatus => {
        client.user.setActivity(newStatus)
    });
    // const job4 = schedule.scheduleJob('* * * * *', function() {
    //     timetableFile.genStatus().then(newStatus => {
    //         client.user.setActivity(newStatus)
    //     });
    // });
})

// const job1 = schedule.scheduleJob('15 * * * *', function() {
//     runTimetableDM()
// });

// const job2 = schedule.scheduleJob('35 * * * *', function() {
//     runTimetableDM()
// });

// const job3 = schedule.scheduleJob('55 * * * *', function() {
//     runTimetableDM()
// });

// function runTimetableDM() {
//     console.log("Run 20mins thing")
//     const messages = timetableFile.getTimetables()
//     console.log(messages)
//     if (messages[0]) {
//         messages[1].forEach(message => {
//             try {
//                 client.users.cache.get(message[0]).send(message[1])
//             } catch {
//                 console.log("Cache error")
//             }
//         })
//     }
// }

client.on('interactionCreate', async interaction => {
    // console.log(`${interaction.user.tag} in #${interaction.channel.name} triggered an interaction.`);
    if (interaction.isButton()) {
        try {
            const command = client.commands.get(interaction.customId.split('-')[0]);
            await command.button(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while pressing this button!', ephemeral: true });
            client.users.cache.get('474153993602465793').send(error.stack)
        }
    }
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        client.users.cache.get('474153993602465793').send(error.stack)
    }
});

// Login to Discord with your client's token
client.login(token)