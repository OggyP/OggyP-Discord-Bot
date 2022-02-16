const { SlashCommandBuilder } = require('@discordjs/builders');
var fs = require('fs');
const { loginCreds } = require('../config.json');
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

var timetables = {}
var defaultInfo = {}
var additionalInfo = {}
var timetableByName = {}
var IDbyName = {}
var classList = {}
var studentsClasses = {}

let bellTimes;
fs.readFile("belltimes.json", 'utf8', function(err, buf) {
    bellTimes = JSON.parse(buf.toString())
});

const classToColour = {
    "ENA": "#f9e909",
    "MA": "#fc3232",
    "IST": "#e702fc",
    "SC": "#00f7f7",
    "AGD": "#b204f2",
    "CO": "#d37904",
    "PE": "#4ffc05",
    "SP": "#0125c1",
    "GEO": "#fc8405",
    "HIS": "#a37530",
    "HM": "#75784f",
    "MU": "#9763ba",
    "FR": "#ffffff",
    "VDPH": "#1e120c",
    "PC": "#f9e909",
    "ILP": "#0e63b2"
}

const dayFromNum = {
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday'
};

fs.readFile("data/timetables.json", 'utf8', function(err, buf) {
    timetables = JSON.parse(buf.toString())
});

fs.readFile("./data/timetablesByName.json", 'utf8', function(err, buf) {
    timetableByName = JSON.parse(buf.toString())
});

fs.readFile("./resources/classList.json", 'utf8', function(err, buf) {
    classList = JSON.parse(buf.toString())
});

fs.readFile("./resources/both/nameToClasses.json", 'utf8', function(err, buf) {
    studentsClasses = JSON.parse(buf.toString())
});

fs.readFile("./resources/both/nameToId.json", 'utf8', function(err, buf) {
    IDbyName = JSON.parse(buf.toString())
});

fs.readFile("data/defaultInfo.json", 'utf8', function(err, buf) {
    defaultInfo = JSON.parse(buf.toString())
});

fs.readFile("data/jalapeno.json", 'utf8', function(err, buf) {
    additionalInfo = JSON.parse(buf.toString())
    var currentDay = (new Date()).getDay()
    let changeOfInfo = false;
    for (var i = 0; i <= 7; i++) {
        if (additionalInfo.hasOwnProperty(i) && i < currentDay) {
            delete additionalInfo[i]
            console.log("delete " + i)
            changeOfInfo = true
        }
    }
    if (changeOfInfo) {
        fs.writeFile("data/jalapeno.json", JSON.stringify(additionalInfo), (err) => {
            if (err) console.log(err);
            console.log("Wrote new jalapeno");
        });
    }
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timetable')
        .setDescription('Everything you could want to know about your NBSC Manly timetable!')
        .addSubcommand(subCommand =>
            subCommand.setName('now')
            .setDescription('Get information on the current period.')
        )
        .addSubcommand(subCommand =>
            subCommand.setName('next')
            .setDescription('Get information on the next current period.')
        )
        .addSubcommand(subCommand =>
            subCommand.setName('today')
            .setDescription('Get every period today.')
            .addUserOption(option => option.setName('target').setDescription('Select a user\'s timetable'))
        )
        .addSubcommand(subCommand =>
            subCommand.setName('tomorrow')
            .setDescription('Get every period tomorrow.')
            .addUserOption(option => option.setName('target').setDescription('Select a user\'s timetable'))
        )
        // .addSubcommand(subCommand => 
        //     subCommand.setName('login')
        //     .setDescription('Log into your next / current period.')
        //     .addStringOption(option =>
        //         option.setName('username')
        //             .setDescription('School username (not email) for timetable.')
        //             .setRequired(false))
        //     .addStringOption(option =>
        //         option.setName('password')
        //             .setDescription('Password for timetable. CHANGE YOUR PASSWORD TO SOMETHING YOU DON\'T CARE ABOUT.')
        //             .setRequired(false))
        // )
        .addSubcommand(subCommand =>
            subCommand.setName('on')
            .setDescription('Get information on a specific class.')
            .addStringOption(option =>
                option.setName('week')
                .setDescription('A week or B week?')
                .addChoice('Week A', 'a')
                .addChoice('Week B', 'b')
                .setRequired(true))
            .addStringOption(option =>
                option.setName('day')
                .setDescription('Which day?')
                .addChoice('Monday', '1')
                .addChoice('Tuesday', '2')
                .addChoice('Wednesday', '3')
                .addChoice('Thursday', '4')
                .addChoice('Friday', '5')
                .setRequired(true))
            .addStringOption(option =>
                option.setName('period')
                .setDescription('Which period (1-6)?')
                .setRequired(false))
        )
        .addSubcommand(subCommand =>
            subCommand.setName('class')
            .setDescription('Get info about a class.')
            .addStringOption(option =>
                option.setName('code')
                .setDescription('Class code e.g. 10ENA.2')
                .setRequired(true))
        )
        .addSubcommand(subCommand =>
            subCommand.setName('classes')
            .setDescription('Get all the classes of a student.')
            .addStringOption(option =>
                option.setName('name')
                .setDescription('Student anem e.g. `Oscar Pritchard`')
                .setRequired(true))
        )
        .addSubcommand(subCommand =>
            subCommand.setName('whereis')
            .setDescription('Get the timetable of a specific person.')
            .addStringOption(option =>
                option.setName('name')
                .setDescription('The student\'s full name.')
                .setRequired(true))
            .addStringOption(option =>
                option.setName('week')
                .setDescription('A week or B week?')
                .addChoice('Week A', 'a')
                .addChoice('Week B', 'b')
                .setRequired(true))
            .addStringOption(option =>
                option.setName('day')
                .setDescription('Which day?')
                .addChoice('Monday', '1')
                .addChoice('Tuesday', '2')
                .addChoice('Wednesday', '3')
                .addChoice('Thursday', '4')
                .addChoice('Friday', '5')
                .setRequired(true))
        )
        .addSubcommand(subCommand =>
            subCommand.setName('bind')
            .setDescription('Bind your timetable URL with your discord account.')
            .addStringOption(option =>
                option.setName('name')
                .setDescription('Your FULL NAME')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand =>
            subCommand.setName('notifications')
            .setDescription('Do you want OggyP Bot to notify you of classes that you have.')
            .addBooleanOption(option =>
                option.setName('notify')
                .setDescription('Do you want notifications?')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand =>
            subCommand.setName('addinfo')
            .setDescription('This command is to allow kaelan to add jalapeno info.')
            .addStringOption(option =>
                option.setName('code')
                .setDescription('This is the class code')
                .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('info')
                .setDescription('Info to add about the class.')
                .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('day')
                .setDescription('Which day?')
                .addChoice('Today', 'Today')
                .addChoice('Tomorrow', 'Tomorrow')
                .setRequired(true))
        )
        .addSubcommand(subCommand =>
            subCommand.setName('addinfobulk')
            .setDescription('This command is to allow kaelan to add jalapeno info.')
            .addStringOption(option =>
                option.setName('stuff')
                .setDescription('classCode - Info | classCode - Info')
                .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('day')
                .setDescription('Which day?')
                .addChoice('Today', 'Today')
                .addChoice('Tomorrow', 'Tomorrow')
                .setRequired(true))
        )
        .addSubcommand(subCommand =>
            subCommand.setName('setdefault')
            .setDescription('Set deafult additional info for a class (Kaelan only).')
            .addStringOption(option =>
                option.setName('week')
                .setDescription('A week or B week?')
                .addChoice('Week A', 'a')
                .addChoice('Week B', 'b')
                .setRequired(true))
            .addStringOption(option =>
                option.setName('day')
                .setDescription('Which day?')
                .addChoice('Monday', '1')
                .addChoice('Tuesday', '2')
                .addChoice('Wednesday', '3')
                .addChoice('Thursday', '4')
                .addChoice('Friday', '5')
                .setRequired(true))
            .addStringOption(option =>
                option.setName('period')
                .setDescription('Which period (1-6)?')
                .setRequired(true))
            .addStringOption(option =>
                option.setName('code')
                .setDescription('The class code')
                .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('info')
                .setDescription('Default info to display about the class.')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand =>
            subCommand.setName('json')
            .setDescription('Get your own timetable as JSON.')
            .addUserOption(option => option.setName('target').setDescription('ADMIN ONLY! Select a specific user\' timetable.'))
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'bind') {
            await interaction.deferReply();
            var name = interaction.options.getString('name').toLowerCase()
            var url = IDbyName[name]
            if (!url) {
                interaction.editReply('Student `' + interaction.options.getString('name') + '` not found.')
                return
            }
            url = 'https://timetable.nbscmanlys-h.schools.nsw.edu.au/97c9768f-1601-4f84-89ba-0c062d66c0d3/' + url
            scrapeTimetable(url).then(timetable => {
                timetables[interaction.user.id] = timetable
                fs.writeFile("data/jalapeno.json", JSON.stringify(timetables), (err) => {
                    if (err) console.log(err);
                    console.log("Wrote new timetables file for " + userTimetable.name);
                    interaction.editReply(userTimetable.name + ", you have successfully bound your timetable.")
                });
            }).catch(interaction.editReply('You need to bind your timetable . e.g. /timetable bind Oscar Pritchard`'))
        } else if (interaction.options.getSubcommand() === 'on') {
            if (timetables.hasOwnProperty(interaction.user.id)) {
                if (interaction.options.getString('period') !== null) {
                    sendTimetableEmbed(interaction, false, interaction.options.getString('week'), interaction.options.getString('day'), interaction.options.getString('period'))
                } else {
                    sendDayEmbed(interaction.options.getString('week'), interaction.options.getString('day'), interaction)
                }
            } else {
                interaction.reply('You need to bind your timetable . e.g. /timetable bind Oscar Pritchard')
            }
        } else if (interaction.options.getSubcommand() === 'whereis') {
            let name = interaction.options.getString('name').toLowerCase()
            if (!timetableByName.hasOwnProperty(name)) {
                if (IDbyName.hasOwnProperty(name)) {
                    interaction.deferReply()
                    scrapeTimetable('https://timetable.nbscmanlys-h.schools.nsw.edu.au/97c9768f-1601-4f84-89ba-0c062d66c0d3/' + IDbyName[name]).then(timetable => {
                        timetableByName[name] = timetable
                        fs.writeFile("./data/timetablesByName.json", JSON.stringify(timetableByName), (err) => {
                            if (err) console.log(err);
                            console.log("Wrote new timetables by name file");
                            sendDayEmbedOfPerson(interaction.options.getString('week'), interaction.options.getString('day'), interaction, name, true)
                        });
                    })
                } else {
                    interaction.reply("Unknown student")
                }
            } else {
                sendDayEmbedOfPerson(interaction.options.getString('week'), interaction.options.getString('day'), interaction, name, false)
            }
        } else if (interaction.options.getSubcommand() === 'now') {
            if (timetables.hasOwnProperty(interaction.user.id)) {
                var currentDay = (new Date()).getDay().toString()
                getCurrentPeriod(currentDay)
                    .then(currentPeriod => {
                        if (currentPeriod[0]) {
                            var week = 'a'
                            if ((new Date()).getWeek() % 2 === 0) {
                                week = 'b'
                            }
                            sendTimetableEmbed(interaction, false, week, currentDay, currentPeriod[1], true)
                        } else {
                            const row = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                    .setCustomId('timetable-next')
                                    .setLabel('Next Period')
                                    .setStyle('PRIMARY'),
                                    new MessageButton()
                                    .setCustomId('timetable-today-' + interaction.user.id)
                                    .setLabel('Subjects Today')
                                    .setStyle('PRIMARY'),
                                );

                            interaction.reply({ content: 'You have no class now!', ephemeral: false, components: [row] });
                        }
                    })
            } else {
                interaction.reply('You need to bind your timetable . e.g. /timetable bind Oscar Pritchard')
            }
        } else if (interaction.options.getSubcommand() === 'next') {
            if (timetables.hasOwnProperty(interaction.user.id)) {
                var currentDay = (new Date()).getDay().toString()
                nextPeriod(currentDay)
                    .then(currentPeriod => {
                        if (currentPeriod[0]) {
                            var week = 'a'
                            if ((new Date()).getWeek() % 2 === 0) {
                                week = 'b'
                            }
                            sendTimetableEmbed(interaction, false, week, currentDay, currentPeriod[1], true)
                        } else {
                            const row = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                    .setCustomId('timetable-now')
                                    .setLabel('Current Period')
                                    .setStyle('PRIMARY'),
                                    new MessageButton()
                                    .setCustomId('timetable-today-' + interaction.user.id)
                                    .setLabel('Subjects Today')
                                    .setStyle('PRIMARY'),
                                );

                            interaction.reply({ content: 'You have no more periods today!', components: [row] })
                        }
                    })
            } else {
                interaction.reply('You need to bind your timetable . e.g. /timetable bind Oscar Pritchard')
            }
        } else if (interaction.options.getSubcommand() === 'class') {
            let classCode = interaction.options.getString('code')
            let classCodeToRead = null
            if (classList.hasOwnProperty(classCode.toUpperCase())) {
                classCodeToRead = classCode.toUpperCase()
            } else if (classList.hasOwnProperty(classCode)) {
                classCodeToRead = classCode
            }
            if (!classCodeToRead) {
                interaction.reply('That class does not exist. Please enter a valid class code. E.g. 10ENA.2')
                return
            } else
                sendClassInfo(classCodeToRead, interaction)
        } else if (interaction.options.getSubcommand() === 'classes') {
            let name = interaction.options.getString('name').toLowerCase()
            if (!studentsClasses.hasOwnProperty(name)) {
                interaction.reply('That student does not exist. Please enter a valid student\'s name. E.g. `Oscar Pritchard`')
                return
            }
            sendClasses(studentsClasses[name], interaction)
        } else if (interaction.options.getSubcommand() === 'today') {
            var week = 'a'
            if ((new Date()).getWeek() % 2 === 0) {
                week = 'b'
            }
            var currentDay = (new Date()).getDay().toString()
            const member = interaction.options.getMember('target');
            if (member !== null) {
                interaction.user = member
            }
            sendDayEmbed(week, currentDay, interaction)
        } else if (interaction.options.getSubcommand() === 'tomorrow') {
            var week = 'a'
            if ((new Date()).getWeek() % 2 === 0) {
                week = 'b'
            }
            var currentDay = ((new Date()).getDay() + 1).toString()
            if (currentDay == 1) {
                if (week == 'a') {
                    week = 'b'
                } else {
                    week = 'a'
                }
            }
            const member = interaction.options.getMember('target');
            if (member !== null) {
                interaction.user = member
            }
            sendDayEmbed(week, currentDay, interaction)
        }
        // else if (interaction.options.getSubcommand() === 'notifications') {
        //     if (interaction.options.getBoolean('notify')) {
        //         if (notify.includes(interaction.user.id)) {
        //             interaction.reply("You are already being notified!")
        //         } else {
        //             notify.push(interaction.user.id)
        //             fs.writeFile("notify.txt", notify.join('\n'), (err) => {
        //                 if (err) console.log(err);
        //                 console.log("Wrote to notify file.");
        //                 interaction.reply("You will now be notified of starting classes.")
        //             });
        //         }
        //     } else {
        //         if (notify.includes(interaction.user.id)) {
        //             notify.splice(notify.indexOf(interaction.user.id), 1)
        //             fs.writeFile("notify.txt", notify.join('\n'), (err) => {
        //                 if (err) console.log(err);
        //                 console.log("Wrote to notify file.");
        //                 interaction.reply("You will no longer be notified of starting classes.")
        //             });
        //         } else {
        //             interaction.reply("You are already not being notified!")
        //         }
        //     }
        // }
        // else if (interaction.options.getSubcommand() === "login") {
        //     await interaction.deferReply()
        //     if (interaction.options.getString('username') === null) {
        //         if (timetables.hasOwnProperty(interaction.user.id)) {
        //             if (timetables[interaction.user.id].hasOwnProperty('password')) {
        //                 var week = 'a'
        //                 if ((new Date()).getWeek() % 2 === 0) {
        //                     week = 'b'
        //                 }
        //                 var currentDay = (new Date()).getDay()
        //                 if (currentDay > 0 && currentDay < 6) {
        //                     getCurrentPeriod(currentDay.toString())
        //                     .then(currentPeriod => {
        //                         if (currentPeriod[0]) {
        //                             var period = currentPeriod[1]
        //                             markAttendance(timetables[interaction.user.id], week, currentDay.toString(), period, interaction, true)
        //                         } else {
        //                             console.log("No class now, trying next period")
        //                             nextPeriod(currentDay.toString())
        //                             .then(nextPeriod => {
        //                                 if (nextPeriod[0]) {
        //                                     var period = nextPeriod[1]
        //                                     markAttendance(timetables[interaction.user.id], week, currentDay.toString(), period, interaction, true)
        //                                 } else {
        //                                     interaction.editReply({ content: 'You have no more periods today!'})
        //                                 }
        //                             })
        //                         }
        //                     })
        //                 } else {
        //                     interaction.editReply({ content: 'It is a weekend.', ephemeral: true })
        //                 }
        //             } else {
        //                 interaction.editReply({ content: 'You need to provided your school username and password with /timetable login username:USERNAME password:PASSWORD.', ephemeral: true })
        //             }
        //         } else {
        //             interaction.editReply({ content: 'You need bind your timetable first.', ephemeral: true })
        //         }
        //     } else if (interaction.options.getString('password') === null) {
        //         interaction.editReply({ content: 'You need to provided both your username and password to set your login info.', ephemeral: true })
        //     } else {
        //         // provided both usernaem and password for login
        //         if (timetables.hasOwnProperty(interaction.user.id)) {
        //             timetables[interaction.user.id].password = "email=" + interaction.options.getString('username') + "%40education.nsw.gov.au&password=" + interaction.options.getString('password')
        //             console.log(timetables[interaction.user.id].password)
        //             fs.writeFile("data/jalapeno.json", JSON.stringify(timetables), (err) => {
        //                 if (err) console.log(err);
        //                 console.log("Wrote new timetables file");
        //                 interaction.editReply(timetables[interaction.user.id].name + ", you have successfully bound your login info.")
        //             });
        //             interaction.editReply({ content: 'You have bound your username and password.', ephemeral: true })
        //         } else {
        //             interaction.editReply({ content: 'You need bind your timetable first.', ephemeral: true })
        //         }
        //     }
        // }
        else if (interaction.options.getSubcommand() === 'addinfo') {
            if (interaction.user.id === '515056987113783297' || interaction.user.id === '222148303217885184' || interaction.user.id === '474153993602465793') {
                var currentDay = (new Date()).getDay()
                if (interaction.options.getString('day') === 'Today') {
                    if (!additionalInfo.hasOwnProperty(currentDay)) {
                        additionalInfo[currentDay] = {}
                    }
                    additionalInfo[currentDay][interaction.options.getString('code')] = interaction.options.getString('info')
                } else {
                    if (!additionalInfo.hasOwnProperty(currentDay + 1)) {
                        additionalInfo[currentDay + 1] = {}
                    }
                    additionalInfo[currentDay + 1][interaction.options.getString('code')] = interaction.options.getString('info')
                }
                fs.writeFile("data/jalapeno.json", JSON.stringify(additionalInfo), (err) => {
                    if (err) console.log(err);
                    console.log("Wrote new jalapeno");
                    interaction.reply({ content: 'Additional info about class ' + interaction.options.getString('code') + ' added!', ephemeral: true })
                });
            } else {
                interaction.reply({ content: 'Only Kaelan can do this command!', ephemeral: true })
            }
        } else if (interaction.options.getSubcommand() === 'addinfobulk') {
            if (interaction.user.id === '515056987113783297' || interaction.user.id === '222148303217885184' || interaction.user.id === '474153993602465793') {
                var currentDay = (new Date()).getDay()
                var allClasses = interaction.options.getString('stuff').split(' | ')
                allClasses.forEach(currentClass => {
                    if (interaction.options.getString('day') === 'Today') {
                        if (!additionalInfo.hasOwnProperty(currentDay)) {
                            additionalInfo[currentDay] = {}
                        }
                        additionalInfo[currentDay][currentClass.split(' - ')[0]] = currentClass.split(' - ')[1]
                    } else {
                        if (!additionalInfo.hasOwnProperty(currentDay + 1)) {
                            additionalInfo[currentDay + 1] = {}
                        }
                        additionalInfo[currentDay + 1][currentClass.split(' - ')[0]] = currentClass.split(' - ')[1]
                    }
                })
                fs.writeFile("data/jalapeno.json", JSON.stringify(additionalInfo), (err) => {
                    if (err) console.log(err);
                    console.log("Wrote new jalapeno");
                    interaction.reply({ content: 'Additional info about class ' + interaction.options.getString('code') + ' added!', ephemeral: true })
                });
            } else {
                interaction.reply({ content: 'Only Kaelan can do this command!', ephemeral: true })
            }
        } else if (interaction.options.getSubcommand() === 'setdefault') {
            if (interaction.user.id === '515056987113783297' || interaction.user.id === '222148303217885184' || interaction.user.id === '474153993602465793') {
                if (interaction.options.getString('period') !== null) {
                    if (interaction.options.getString('period') !== 'Assembly') {
                        if (!defaultInfo[interaction.options.getString('week')].hasOwnProperty(interaction.options.getString('day'))) {
                            defaultInfo[interaction.options.getString('week')][interaction.options.getString('day')] = {}
                        }
                        if (!defaultInfo[interaction.options.getString('week')][interaction.options.getString('day')].hasOwnProperty(interaction.options.getString('period'))) {
                            defaultInfo[interaction.options.getString('week')][interaction.options.getString('day')][interaction.options.getString('period')] = {}
                        }
                        defaultInfo[interaction.options.getString('week')][interaction.options.getString('day')][interaction.options.getString('period')][interaction.options.getString('code')] = interaction.options.getString('info')
                        fs.writeFile("data/defaultInfo.json", JSON.stringify(defaultInfo), (err) => {
                            if (err) console.log(err);
                            interaction.reply({ content: 'Default info added!', ephemeral: true })
                        });
                    } else {
                        interaction.reply("Please...")
                    }
                } else {
                    interaction.reply({ content: 'KAELAN!!! SPECIFY THE PERIOD!!!', ephemeral: true })
                }
            } else {
                interaction.reply({ content: 'Only Kaelan can do this command!', ephemeral: true })
            }
        } else if (interaction.options.getSubcommand() === 'json') {
            if (interaction.user.id === '474153993602465793') {
                const member = interaction.options.getMember('target');
                if (member !== null) {
                    interaction.user = member
                }
            }
            if (timetables.hasOwnProperty(interaction.user.id)) {
                fs.writeFile("./bufferFile.json", JSON.stringify(timetables[interaction.user.id]), (err) => {
                    if (err) console.log(err);
                    interaction.reply({
                        content: 'JSON Timetable WARNGING! The file will include your password if you have setup /timetable login:',
                        ephemeral: true,
                        files: [{
                            attachment: './bufferFile.json',
                            name: 'timetable.json'
                        }]
                    })
                });
            } else {
                interaction.reply('You need to bind your timetable . e.g. /timetable bind Oscar Pritchard')
            }
        }
    },
    // Button interactions
    async button(interaction) {
        if (interaction.customId === 'timetable-next') {
            if (timetables.hasOwnProperty(interaction.user.id)) {
                var currentDay = (new Date()).getDay().toString()
                nextPeriod(currentDay)
                    .then(currentPeriod => {
                        if (currentPeriod[0]) {
                            var week = 'a'
                            if ((new Date()).getWeek() % 2 === 0) {
                                week = 'b'
                            }
                            sendTimetableEmbed(interaction, true, week, currentDay, currentPeriod[1], true)
                        } else {
                            const row = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                    .setCustomId('timetable-now')
                                    .setLabel('Current Period')
                                    .setStyle('PRIMARY'),
                                    new MessageButton()
                                    .setCustomId('timetable-today-' + interaction.user.id)
                                    .setLabel('Subjects Today')
                                    .setStyle('PRIMARY'),
                                );

                            interaction.reply({ content: 'You have no more periods today!', components: [row] })
                        }
                    })
            } else {
                interaction.reply('You need to bind your timetable . e.g. /timetable bind Oscar Pritchard')
            }
        } else if (interaction.customId === 'timetable-now') {
            if (timetables.hasOwnProperty(interaction.user.id)) {
                var currentDay = (new Date()).getDay().toString()
                getCurrentPeriod(currentDay)
                    .then(currentPeriod => {
                        if (currentPeriod[0]) {
                            var week = 'a'
                            if ((new Date()).getWeek() % 2 === 0) {
                                week = 'b'
                            }
                            sendTimetableEmbed(interaction, true, week, currentDay, currentPeriod[1], true)
                        } else {
                            const row = new MessageActionRow()
                                .addComponents(
                                    new MessageButton()
                                    .setCustomId('timetable-next')
                                    .setLabel('Next Period')
                                    .setStyle('PRIMARY'),
                                    new MessageButton()
                                    .setCustomId('timetable-today-' + interaction.user.id)
                                    .setLabel('Subjects Today')
                                    .setStyle('PRIMARY'),
                                );

                            interaction.reply({ content: 'You have no class now!', components: [row] })
                        }
                    })
            } else {
                interaction.reply('You need to bind your timetable . e.g. /timetable bind Oscar Pritchard')
            }
        } else if (interaction.customId.startsWith('timetable-today')) {
            if (interaction.customId.split('-')[2] === interaction.user.id) {
                var week = 'a'
                if ((new Date()).getWeek() % 2 === 0) {
                    week = 'b'
                }
                var currentDay = (new Date()).getDay().toString()
                sendDayEmbed(week, currentDay, interaction, true)
            } else {
                interaction.reply({ content: 'This is not your timetable idot!', ephemeral: true });
            }
        }
        //timetable-day-WEEK-DAY-ID
        else if (interaction.customId.startsWith('timetable-day')) {
            info = interaction.customId.split('-')
            if (info[4] === interaction.user.id) {
                sendDayEmbed(info[2], info[3], interaction, true)
            } else {
                interaction.reply({ content: 'This is not your timetable idot!', ephemeral: true });
            }
        } else if (interaction.customId.startsWith('timetable-class')) {
            var info = interaction.customId.split('-')
            console.log(info)
            if (info[5] === interaction.user.id) {
                sendTimetableEmbed(interaction, true, info[2], info[3], info[4])
            } else {
                interaction.reply({ content: 'This is not your timetable idot!', ephemeral: true });
            }
        }
        // else if (interaction.customId === 'timetable-login') {
        //     if (timetables[interaction.user.id].hasOwnProperty('password')) {
        //         var week = 'a'
        //         if ((new Date()).getWeek() % 2 === 0) {
        //             week = 'b'
        //         }
        //         var currentDay = (new Date()).getDay()
        //         if (currentDay > 0 && currentDay < 6) {
        //             getCurrentPeriod(currentDay.toString())
        //             .then(currentPeriod => {
        //                 if (currentPeriod[0]) {
        //                     var period = currentPeriod[1]
        //                     markAttendance(timetables[interaction.user.id], week, currentDay.toString(), period, interaction)
        //                 } else {
        //                     console.log("No class now, trying next period")
        //                     nextPeriod(currentDay.toString())
        //                     .then(nextPeriod => {
        //                         if (nextPeriod[0]) {
        //                             var period = nextPeriod[1]
        //                             markAttendance(timetables[interaction.user.id], week, currentDay.toString(), period, interaction)
        //                         } else {
        //                             interaction.reply({ content: 'You have no more periods today!'})
        //                         }
        //                     })
        //                 }
        //             })
        //         } else {
        //             interaction.reply({ content: 'It is a weekend.', ephemeral: true })
        //         }
        //     } else {
        //         interaction.reply({ content: 'You need to provided your school username and password with /timetable login username:USERNAME password:PASSWORD.', ephemeral: true })
        //     }
        // }
    },
    getTimetables() {
        // var week = 'a'
        // if ((new Date()).getWeek() % 2 === 0) {
        //     week = 'b'
        // }
        // var currentDay = (new Date()).getDay()
        // if (currentDay > 0 && currentDay < 6) {
        //     var periodStart = false;
        //     var period;
        //     for (var i = 1; i <= 6; i ++) {
        //         if (bellTimes[currentDay.toString()].hasOwnProperty(i.toString())) {
        //             currentDate = new Date()
        //             var periodStartTime = bellTimes[currentDay.toString()][i.toString()][0]
        //             startDate = new Date(currentDate.getTime());
        //             startDate.setHours(periodStartTime.split(":")[0]);
        //             startDate.setMinutes(periodStartTime.split(":")[1]);

        //             var timeDif = Math.abs(currentDate - startDate)

        //             if (timeDif < 360000) {
        //                 period = i.toString()
        //                 periodStart = true;
        //                 break;
        //             }
        //         }
        //     }
        //     if (periodStart) {
        //         var messagesToSend = []
        //         notify.forEach(userID => {
        //             if (timetables.hasOwnProperty(userID)) {
        //                 messagesToSend.push([userID, createEmbedTimetable(userID, week, currentDay.toString(), period)])
        //             }
        //         })
        //         return [true, messagesToSend]
        //     }
        // }
        return [false]

    },
    genStatus: genStatus = () => {
        return new Promise((resolve, reject) => {
            var newStatus = "Chess.OggyP.com!"
            var week = 'a'
            if ((new Date()).getWeek() % 2 === 0) {
                week = 'b'
            }
            var currentDay = (new Date()).getDay()
            if (currentDay > 0 && currentDay < 6) {
                getCurrentPeriod(currentDay.toString())
                    .then(currentPeriod => {
                        if (currentPeriod[0]) {
                            var period = currentPeriod[1]
                            newStatus = "Period " + period + " now!"
                            resolve(newStatus)
                        } else {
                            nextPeriod(currentDay.toString())
                                .then(nextPeriod => {
                                    if (nextPeriod[0]) {
                                        var period = nextPeriod[1]
                                        currentDate = new Date()
                                        var periodStartTime = bellTimes[currentDay.toString()][period][0]
                                        startDate = new Date(currentDate.getTime());
                                        startDate.setHours(periodStartTime.split(":")[0]);
                                        startDate.setMinutes(periodStartTime.split(":")[1]);
                                        var timeDif = Math.abs(currentDate - startDate) / 1000 / 60
                                        if (timeDif % 60 < 10) {
                                            newStatus = "Period " + period + " in " + Math.floor(timeDif / 60) + ":0" + timeDif % 60
                                        } else {
                                            newStatus = "Period " + period + " in " + Math.floor(timeDif / 60) + ":" + timeDif % 60
                                        }
                                        resolve(newStatus)
                                    } else {
                                        resolve(newStatus)
                                    }
                                })
                        }
                    })
            }
        })
    }
};

function sendTimetableEmbed(interaction, edit, week, day, period, loginOption = false) {
    if (timetables.hasOwnProperty(interaction.user.id)) {
        if (timetables[interaction.user.id].hasOwnProperty(week) && timetables[interaction.user.id][week].hasOwnProperty(day) && timetables[interaction.user.id][week][day].hasOwnProperty(period)) {
            // Get current Day etc
            var today = (new Date()).getDay().toString()
            var thisWeek = 'a'
            if ((new Date()).getWeek() % 2 === 0) {
                thisWeek = 'b'
            }

            var subject = timetables[interaction.user.id][week][day][period]
            var studentName = timetables[interaction.user.id].name
            var studentTimetableURL = timetables[interaction.user.id].url
            var subjectTimes = JSON.parse(JSON.stringify(bellTimes[day][period]));
            let subjectName = (subject.name.includes('|')) ? subject.name.split("| ")[1] : subject.name

            if (thisWeek == week && day == today) {
                currentDate = new Date()
                var periodStartTime = subjectTimes[0]
                startDate = new Date(currentDate.getTime());
                startDate.setHours(periodStartTime.split(":")[0]);
                startDate.setMinutes(periodStartTime.split(":")[1]);

                if (startDate > currentDate) {
                    var timeDif = Math.abs(currentDate - startDate) / 1000 / 60
                    if (timeDif % 60 < 10) {
                        subjectTimes[0] = subjectTimes[0] + " (Starts in " + Math.floor(timeDif / 60) + ":0" + timeDif % 60 + ")"
                    } else {
                        subjectTimes[0] = subjectTimes[0] + " (Starts in " + Math.floor(timeDif / 60) + ":" + timeDif % 60 + ")"
                    }
                }
            }
            var colour;
            var subjectCode = subject.code.split('.')[0].replace(/[0-9]/g, '')
            if (classToColour.hasOwnProperty(subjectCode)) {
                colour = classToColour[subjectCode]
            } else {
                colour = "#000000"
            }
            var embed = new MessageEmbed()
                .setColor(colour)
                .setTitle(subjectName)
                .setURL(studentTimetableURL)
                .setAuthor(studentName, 'https://test.oggyp.com/school.png', studentTimetableURL)
                .setDescription(subject.code)
                .addFields({ name: 'Teacher', value: (subject.teacher) ? subject.teacher : 'unknown', inline: true }, { name: 'Week ' + week.toUpperCase(), value: dayFromNum[day] + " Period " + period, inline: true }, { name: 'Room', value: subject.room }, { name: 'Start Time', value: subjectTimes[0], inline: true }, { name: 'End Time', value: subjectTimes[1], inline: true }, )
                .setTimestamp()
                .setFooter(studentTimetableURL.split('/')[4] + " | NBSC Manly Timetable", 'https://test.oggyp.com/school.png');
            if (additionalInfo.hasOwnProperty(parseInt(day)) && additionalInfo[parseInt(day)].hasOwnProperty(subject.code)) {
                embed.addFields({ name: 'Additional Info', value: additionalInfo[parseInt(day)][subject.code] });
            } else if (defaultInfo[week].hasOwnProperty(day) && defaultInfo[week][day].hasOwnProperty(period) && defaultInfo[week][day][period].hasOwnProperty(subject.code)) {
                embed.addFields({ name: 'Additional Info', value: defaultInfo[week][day][period][subject.code] });
            }

            var message = { embeds: [embed] }
            var messageButtons = [
                []
            ]
            let msgBtnRow = 0
                // Set button for previous period
            let idx = 0
            let startIndex = bellTimes.order[day].indexOf(period)
            while (idx < startIndex) {
                if (timetables[interaction.user.id][week][day].hasOwnProperty(bellTimes.order[day][idx])) {
                    if (messageButtons[msgBtnRow].length > 2) {
                        messageButtons.push([])
                        msgBtnRow++
                    }
                    let newPeriod = bellTimes.order[day][idx]
                    let periodToDisplay = (altPeriodNames.hasOwnProperty(newPeriod)) ? altPeriodNames[newPeriod] : newPeriod
                    messageButtons[msgBtnRow].push(
                        new MessageButton()
                        .setCustomId('timetable-class-' + week + "-" + day + "-" + newPeriod + "-" + interaction.user.id)
                        .setLabel(periodToDisplay + ' | ' + timetables[interaction.user.id][week][day][newPeriod].code)
                        .setStyle('DANGER')
                    )
                }
                idx++
            }
            // set button for current timetable
            if (messageButtons[msgBtnRow].length > 2) {
                messageButtons.push([])
                msgBtnRow++
            }
            let currentPeriodToDisplay = (altPeriodNames.hasOwnProperty(period)) ? altPeriodNames[period] : period
            messageButtons[msgBtnRow].push(
                new MessageButton()
                .setCustomId('timetable-day-' + week + '-' + day + "-" + interaction.user.id)
                .setLabel(currentPeriodToDisplay + ' | ' + subject.code)
                .setStyle('SECONDARY')
            )

            idx = startIndex
            while (idx < bellTimes.order[day].length - 1) {
                if (timetables[interaction.user.id][week][day].hasOwnProperty(bellTimes.order[day][idx + 1])) {
                    if (messageButtons[msgBtnRow].length > 2) {
                        messageButtons.push([])
                        msgBtnRow++
                    }
                    let newPeriod = bellTimes.order[day][idx + 1]
                    let periodToDisplay = (altPeriodNames.hasOwnProperty(newPeriod)) ? altPeriodNames[newPeriod] : newPeriod
                    messageButtons[msgBtnRow].push(
                        new MessageButton()
                        .setCustomId('timetable-class-' + week + "-" + day + "-" + newPeriod + "-" + interaction.user.id)
                        .setLabel(periodToDisplay + ' | ' + timetables[interaction.user.id][week][day][newPeriod].code)
                        .setStyle('SUCCESS')
                    )
                }
                idx++
            }
            // // Set button for next period
            // if (loginOption) {
            //     messageButtons.push(
            //         new MessageButton()
            //         .setCustomId('timetable-login')
            //         .setLabel('Login To Current/Next Class')
            //         .setStyle('SUCCESS')
            //     )
            // }
            var rows = [];
            let i = 0
            messageButtons.forEach(buttonList => {
                rows.push(new MessageActionRow())
                buttonList.forEach(button => {
                    rows[i]
                        .addComponents(
                            button,
                        );
                })
                i++
            })

            message.components = rows

            if (edit) {
                try {
                    interaction.update(message)
                } catch (e) {
                    interaction.reply(message)
                }
            } else {
                interaction.reply(message)
            }

        } else {
            interaction.reply({ content: 'Sorry, that class does not exist.', ephemeral: true });
        }
    } else {
        interaction.reply({ content: 'You need to bind your timetable . e.g. /timetable bind Oscar Pritchard', ephemeral: true });
    }
}

function createEmbedTimetable(userID, week, day, period) {
    let periodToDisplay = (altPeriodNames.hasOwnProperty(period)) ? altPeriodNames[period] : period
    var subject = timetables[userID][week][day][period]
    var studentName = timetables[userID].name
    var studentTimetableURL = timetables[userID].url
    var subjectTimes = bellTimes[day][period]
    var colour;
    let subjectName = (subject.name.includes('|')) ? subject.name.split("| ")[1] : subject.name
    var subjectCode = subject.code.split('.')[0].replace(/[0-9]/g, '')
    if (classToColour.hasOwnProperty(subjectCode)) {
        colour = classToColour[subjectCode]
    } else {
        colour = "#000000"
    }
    var newEmbed = new MessageEmbed()
        .setColor(colour)
        .setTitle(subjectName)
        .setURL(studentTimetableURL)
        .setAuthor(studentName, 'https://test.oggyp.com/school.png', studentTimetableURL)
        .setDescription(subject.code)
        .addFields({ name: 'Teacher', value: subject.teacher, inline: true }, { name: 'Week ' + week.toUpperCase(), value: dayFromNum[day] + " Period " + period, inline: true }, { name: 'Room', value: subject.room }, { name: 'Start Time', value: subjectTimes[0], inline: true }, { name: 'End Time', value: subjectTimes[1], inline: true }, )
        .setTimestamp()
        .setFooter(studentTimetableURL.split('/')[4] + " | NBSC Manly Timetable", 'https://test.oggyp.com/school.png');

    if (additionalInfo.hasOwnProperty(parseInt(day)) && additionalInfo[parseInt(day)].hasOwnProperty(subject.code)) {
        newEmbed.addFields({ name: 'Additional Info', value: additionalInfo[parseInt(day)][subject.code] });
    } else if (defaultInfo[week].hasOwnProperty(day) && defaultInfo[week][day].hasOwnProperty(period) && defaultInfo[week][day][period].hasOwnProperty(subject.code)) {
        newEmbed.addFields({ name: 'Additional Info', value: defaultInfo[week][day][period][subject.code] });
    }


    var message = { embeds: [newEmbed] }

    var messageButtons = [
        []
    ]
    let msgBtnRow = 0
    let idx = 0
    let startIndex = bellTimes.order[day].indexOf(period)
    while (idx < startIndex) {
        if (timetables[userID][week][day].hasOwnProperty(bellTimes.order[day][idx])) {
            if (messageButtons[msgBtnRow].length > 2) {
                messageButtons.push([])
                msgBtnRow++
            }
            let newPeriod = bellTimes.order[day][idx]
            let periodToDisplay = (altPeriodNames.hasOwnProperty(newPeriod)) ? altPeriodNames[newPeriod] : newPeriod
            messageButtons[msgBtnRow].push(
                new MessageButton()
                .setCustomId('timetable-class-' + week + "-" + day + "-" + bellTimes.order[day][idx] + "-" + userID)
                .setLabel(periodToDisplay + ' | ' + timetables[userID][week][day][newPeriod].code)
                .setStyle('DANGER')
            )
        }
        idx++
    }

    if (messageButtons[msgBtnRow].length > 2) {
        messageButtons.push([])
        msgBtnRow++
    }

    let currentPeriodToDisplay = (altPeriodNames.hasOwnProperty(period)) ? altPeriodNames[period] : period
    messageButtons[msgBtnRow].push(
        new MessageButton()
        .setCustomId('timetable-today-' + interaction.user.id)
        .setLabel(currentPeriodToDisplay)
        .setStyle('SECONDARY')
    )

    idx = startIndex
    while (idx < bellTimes.order[day].length - 1) {
        if (timetables[userID][week][day].hasOwnProperty(bellTimes.order[day][idx + 1])) {
            if (messageButtons[msgBtnRow].length > 2) {
                messageButtons.push([])
                msgBtnRow++
            }
            let newPeriod = bellTimes.order[day][idx + 1]
            let periodToDisplay = (altPeriodNames.hasOwnProperty(newPeriod)) ? altPeriodNames[newPeriod] : newPeriod
            messageButtons[msgBtnRow].push(
                new MessageButton()
                .setLabel(periodToDisplay + ' | ' + timetables[userID][week][day][newPeriod].code)
                // .setLabel(bellTimes.order[day][idx + 1])
                .setStyle('SUCCESS')
            )
        }
        idx++
    }

    // messageButtons.push(
    //     new MessageButton()
    //     .setCustomId('timetable-login')
    //     .setLabel('Login To Current/Next Class')
    //     .setStyle('SUCCESS')
    // )

    var rows = [new MessageActionRow(), new MessageActionRow(), new MessageActionRow()];
    let i = 0
    messageButtons.forEach(buttonList => {
        buttonList.forEach(button => {
            rows[i]
                .addComponents(
                    button,
                );
        })
        i++
    })

    message.components = [row]
    message.content = subjectName + " starts in 5 minute!"

    return message;
}

let altPeriodNames = {
    'Assembly': "PC"
}

function sendDayEmbed(week, day, interaction, edit = false) {
    if (timetables.hasOwnProperty(interaction.user.id)) {
        if (day > 0 && day < 6) {
            var newEmbed = new MessageEmbed()
                .setColor('#000000')
                .setTitle("Week " + week.toUpperCase() + " " + dayFromNum[day.toString()] + "'s Classes")
                .setURL(timetables[interaction.user.id].url)
                .setAuthor(timetables[interaction.user.id].name + " | Timetable", 'https://test.oggyp.com/school.png', timetables[interaction.user.id].url)

            .setTimestamp()
                .setFooter(timetables[interaction.user.id].url.split('/')[4] + " | NBSC Manly Timetable", 'https://test.oggyp.com/school.png');

            var messageButtons = [
                []
            ]
            let msgBtnRow = 0

            let currentDate = new Date()

            var thisWeek = 'a'
            if ((new Date()).getWeek() % 2 === 0)
                thisWeek = 'b'

            let isToday = false;
            if (day === (new Date()).getDay().toString() && thisWeek === week)
                isToday = true

            let content = ''

            let maxLengths = {
                'period': 0,
                'subjectCode': 0
            }



            bellTimes.order[day].forEach(period => {
                if (timetables[interaction.user.id][week][day.toString()].hasOwnProperty(period)) {
                    let periodToDisplay = (altPeriodNames.hasOwnProperty(period)) ? altPeriodNames[period] : period
                    if (periodToDisplay.length > maxLengths.period) maxLengths.period = periodToDisplay.length
                    let subjectCode = timetables[interaction.user.id][week][day.toString()][period].code
                    if (subjectCode.length > maxLengths.subjectCode) maxLengths.subjectCode = subjectCode.length
                }
            })

            bellTimes.order[day].forEach(period => {
                if (timetables[interaction.user.id][week][day.toString()].hasOwnProperty(period)) {
                    let periodToDisplay = (altPeriodNames.hasOwnProperty(period)) ? altPeriodNames[period] : period
                    let subject = timetables[interaction.user.id][week][day.toString()][period]
                    let periodBellTimes = bellTimes[day][period]

                    startDate = new Date(currentDate.getTime());
                    startDate.setHours(periodBellTimes[0].split(":")[0]);
                    startDate.setMinutes(periodBellTimes[0].split(":")[1]);

                    endDate = new Date(currentDate.getTime());
                    endDate.setHours(periodBellTimes[1].split(":")[0]);
                    endDate.setMinutes(periodBellTimes[1].split(":")[1]);

                    let amtThroughLesson = (currentDate - startDate) / (endDate - startDate)
                    if (amtThroughLesson > 1) amtThroughLesson = 1
                    if (amtThroughLesson < 0) amtThroughLesson = 0

                    let extraSpacesAfter = {
                        'period': maxLengths.period - periodToDisplay.length,
                        'subjectCode': maxLengths.subjectCode - subject.code.length
                    }

                    let bellTimesToShow = `[${periodBellTimes[0]} - ${periodBellTimes[1]}${' '.repeat(10 - periodBellTimes.join('').length)}]` // always length 15



                    if (isToday) {
                        bellTimesToShow
                        if (amtThroughLesson > 0) {
                            if (amtThroughLesson < 1) {
                                let indexToSplice = Math.floor(13 * amtThroughLesson) + 1
                                if (indexToSplice > 1)
                                    bellTimesToShow = bellTimesToShow.slice(0, 1) + "~~__" + bellTimesToShow.slice(1, indexToSplice) + "__~~" + bellTimesToShow.slice(indexToSplice, 15)
                            } else {
                                bellTimesToShow = bellTimesToShow.slice(0, 1) + "~~__" + bellTimesToShow.slice(1, 14) + "__~~" + bellTimesToShow.slice(14, 15)
                            }
                        }
                        bellTimesToShow
                    }

                    content += `**\`${periodToDisplay})${' '.repeat(extraSpacesAfter.period)} ${subject.code + ' '.repeat(extraSpacesAfter.subjectCode)}\`** ${bellTimesToShow} - `

                    if (additionalInfo.hasOwnProperty(day) && additionalInfo[day].hasOwnProperty(timetables[interaction.user.id][week][day.toString()][period].code))
                        content += `${additionalInfo[day][timetables[interaction.user.id][week][day.toString()][period].code]}\n`
                    else if (defaultInfo[week].hasOwnProperty(day.toString()) && defaultInfo[week][day.toString()].hasOwnProperty(period) && defaultInfo[week][day.toString()][period].hasOwnProperty(subject.code))
                        content += `${defaultInfo[week][day.toString()][period][subject.code]}\n`
                    else
                        content += `Room ${subject.room} with ${subject.teacher}\n`

                    // Add button to the day timetable
                    if (endDate <= currentDate) {
                        // period has ended
                        if (messageButtons[msgBtnRow].length > 2) {
                            messageButtons.push([])
                            msgBtnRow++
                        }
                        messageButtons[msgBtnRow].push(
                            new MessageButton()
                            .setCustomId('timetable-class-' + week + "-" + day + "-" + period + "-" + interaction.user.id)
                            .setLabel(`${periodToDisplay} | ${subject.code}`)
                            .setStyle('DANGER')
                        )
                    } else if (currentDate < startDate) {
                        // Period has not stareted
                        if (messageButtons[msgBtnRow].length > 2) {
                            messageButtons.push([])
                            msgBtnRow++
                        }
                        messageButtons[msgBtnRow].push(
                            new MessageButton()
                            .setCustomId('timetable-class-' + week + "-" + day + "-" + period + "-" + interaction.user.id)
                            .setLabel(`${periodToDisplay} | ${subject.code}`)
                            .setStyle('SUCCESS')
                        )
                    } else {
                        if (messageButtons[msgBtnRow].length > 2) {
                            messageButtons.push([])
                            msgBtnRow++
                        }
                        messageButtons[msgBtnRow].push(
                            new MessageButton()
                            .setCustomId('timetable-class-' + week + "-" + day + "-" + period + "-" + interaction.user.id)
                            .setLabel(`${periodToDisplay} | ${subject.code}`)
                            .setStyle('SECONDARY')
                        )
                    }
                }
            });

            newEmbed.setDescription(content)

            var message = { embeds: [newEmbed] }

            var rows = [];
            let i = 0
            messageButtons.forEach(buttonList => {
                rows.push(new MessageActionRow())
                buttonList.forEach(button => {
                    if (!isToday) button.setStyle('SECONDARY')
                    rows[i]
                        .addComponents(
                            button,
                        );
                })
                i++
            })
            message.components = rows

            if (edit) {
                try {
                    interaction.update(message)
                } catch (e) {
                    interaction.reply(message)
                }
            } else {
                interaction.reply(message)
            }
        } else {
            interaction.reply({ content: timetables[interaction.user.id].name + ', it is a weekend.', ephemeral: true })
        }
    } else {
        interaction.reply('You need to bind your timetable . e.g. /timetable bind Oscar Pritchard')
    }
}

function sendClasses(classes, interaction) {
    const firstSection = classes.slice(1, 1 + (classes.length - 1) / 2)
    const secondSection = classes.slice(1 + (classes.length - 1) / 2)
    var Embed = new MessageEmbed()
        .setColor('#0000ff')
        .setTitle(classes[0] + " | Classes")
        .setAuthor(classes[0] + " | OggyP Bot Timetable", 'https://test.oggyp.com/school.png')
        .addFields({
            name: 'Classes That ' + classes[0] + ' has',
            value: (firstSection.join('')) ? firstSection.join('\n') : 'unknown',
            inline: true
        })
        .addFields({
            name: '\u200b',
            value: (secondSection.join('')) ? secondSection.join('\n') : 'unknown',
            inline: true
        })

    .setTimestamp()
        .setFooter(classes[0] + " Classes | NBSC Manly Timetable", 'https://test.oggyp.com/school.png');

    interaction.reply({ embeds: [Embed] })
}

function sendClassInfo(classCode, interaction) {
    const classInfo = classList[classCode]
    var ClassInfoEmbed = new MessageEmbed()
        .setColor('#0000ff')
        .setTitle(classInfo.name + " | Class Info")
        .setAuthor(classCode + " | Class Info", 'https://test.oggyp.com/school.png')
        .addFields({ name: 'Teachers', value: (classInfo.teachers.join('')) ? classInfo.teachers.join(' | ') : 'unknown' })
        .addFields({ name: 'Rooms', value: (classInfo.rooms.join('')) ? classInfo.rooms.join('\n') : 'unknown', inline: true })
        .addFields({
            name: 'Periods',
            value: (classInfo.periods.join('')) ? classInfo.periods.map((item) => {
                const time = item.split(' ')
                return 'Week ' + time[0].toUpperCase() + ' ' + dayFromNum[time[1]] + ' Period ' + time[2]
            }).join('\n') : 'unknown',
            inline: true
        })

    .setTimestamp()
        .setFooter(classCode + " | NBSC Manly Timetable", 'https://test.oggyp.com/school.png');

    var StudentsEmbed = new MessageEmbed()
        .setColor('#0000ff')
        .setTitle(classInfo.name + " | Students")
        .setAuthor(classCode + " | Class Info", 'https://test.oggyp.com/school.png')
        .addFields({ name: classInfo.students.length + ' Students', value: (classInfo.students.slice(0, Math.round(classInfo.students.length / 2)).join('')) ? classInfo.students.slice(0, Math.round(classInfo.students.length / 2)).join('\n') : 'unknown', inline: true })
        .addFields({ name: '\u200b', value: (classInfo.students.slice(Math.round(classInfo.students.length / 2)).join('')) ? classInfo.students.slice(Math.round(classInfo.students.length / 2)).join('\n') : 'unknown', inline: true })

    .setTimestamp()
        .setFooter(classCode + " | NBSC Manly Timetable", 'https://test.oggyp.com/school.png');
    interaction.reply({ embeds: [ClassInfoEmbed, StudentsEmbed] })
}

function sendDayEmbedOfPerson(week, day, interaction, name, edit = false) {
    var newEmbed = new MessageEmbed()
        .setColor('#000000')
        .setTitle("Week " + week.toUpperCase() + " " + dayFromNum[day.toString()] + "'s Classes")
        .setURL(timetableByName[name].url)
        .setAuthor(timetableByName[name].name + " | Timetable", 'https://test.oggyp.com/school.png', timetableByName[name].url)

    .setTimestamp()
        .setFooter(timetableByName[name].url.split('/')[4] + " | NBSC Manly Timetable", 'https://test.oggyp.com/school.png');

    bellTimes.order[day].forEach(period => {
        if (timetableByName[name].hasOwnProperty(week) && timetableByName[name][week].hasOwnProperty(day.toString()))
            if (timetableByName[name][week][day.toString()].hasOwnProperty(period)) {
                let subject = timetableByName[name][week][day.toString()][period]
                let subjectName = (subject.name.includes('|')) ? subject.name.split("| ")[1] : subject.name
                if (additionalInfo.hasOwnProperty(day) && additionalInfo[day].hasOwnProperty(timetableByName[name][week][day.toString()][period].code)) {
                    newEmbed.addFields({ name: subject.code + " | " + subjectName, value: period + ": " + additionalInfo[day][timetableByName[name][week][day.toString()][period].code], inline: false });
                } else if (defaultInfo[week].hasOwnProperty(day.toString()) && defaultInfo[week][day.toString()].hasOwnProperty(period) && defaultInfo[week][day.toString()][period].hasOwnProperty(subject.code)) {
                    newEmbed.addFields({ name: subject.code + " | " + subjectName, value: period + ": " + defaultInfo[week][day.toString()][period][subject.code] });
                } else {
                    newEmbed.addFields({ name: subject.code + " | " + subjectName, value: period + ": Room " + subject.room + " with " + subject.teacher });
                }
            }
    });

    var message = { embeds: [newEmbed] }

    if (edit) {
        interaction.editReply(message)
    } else {
        interaction.reply(message)
    }
}

const scrapeTimetable = (url) => {
    return new Promise((resolve, reject) => {
        if (url.startsWith('https://timetable.nbscmanlys-h.schools.nsw.edu.au/')) {
            var request = require('request');
            var cheerio = require('cheerio');
            var jar = request.jar();
            request = request.defaults({
                jar: jar,
                followAllRedirects: true
            });
            jar = request.jar();

            request.post({
                url: 'https://timetable.nbscmanlys-h.schools.nsw.edu.au/authenticate',
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                method: 'post',
                jar: jar,
                body: loginCreds
            }, function(err, res, body) {
                if (err) {
                    return console.error(err);
                }

                request.get({
                    url: url,
                    method: 'get',
                    jar: jar
                }, function(err, res, body) {
                    if (err) {
                        return console.error(err);
                    }

                    userTimetable = { 'a': {}, 'b': {} }
                    var $ = cheerio.load(body);

                    let week = 'a'
                    $('div > table').each(function(idx, table) {
                        $(table).find('tbody > tr').each(function(i, tableRow) {
                            let day = 1 // Monday
                            $(tableRow).children('td').each(function(j, tableData) {
                                if (tableData.hasOwnProperty('attribs'))
                                    if (tableData.attribs.class === 'p-0 h-100') {
                                        // 0 = Period, 1 = Teacher(s), 2 = Room
                                        classInfo = []
                                        $(tableData).find("span").each(function(k, span) {
                                            classInfo.push($(span).text().trim())
                                        })

                                        dayAsString = day.toString()

                                        if (!userTimetable[week].hasOwnProperty(dayAsString)) userTimetable[week][dayAsString] = {}
                                        userTimetable[week][dayAsString][classInfo[0]] = {}
                                        userTimetable[week][dayAsString][classInfo[0]].teacher = classInfo[1]
                                        userTimetable[week][dayAsString][classInfo[0]].room = classInfo[2]
                                        userTimetable[week][dayAsString][classInfo[0]].name = $(tableData).find('strong').text().trim()
                                        userTimetable[week][dayAsString][classInfo[0]].code = $(tableData).find('small').text().trim().replace(/ /g, '.')

                                    }
                                day++
                            })
                        })
                        week = 'b'
                    })


                    userTimetable.name = $('div > h2.text-secondary > small').text().split('(')[1].split(')')[0];
                    userTimetable.url = url;

                    resolve(userTimetable)
                });
            });
        } else {
            reject('Invalid URL')
        }
    })
}

const getCurrentPeriod = (day) => {
    return new Promise((resolve, reject) => {
        var currentPeriod = [false]
        let foundPeriod = false
        currentDate = new Date()
        if (bellTimes.hasOwnProperty(day)) {
            bellTimes.order[day].forEach(period => {
                if (bellTimes[day].hasOwnProperty(period)) {
                    if (!foundPeriod) {
                        startDate = new Date(currentDate.getTime());
                        startDate.setHours(bellTimes[day][period][0].split(":")[0]);
                        startDate.setMinutes(bellTimes[day][period][0].split(":")[1]);

                        endDate = new Date(currentDate.getTime());
                        endDate.setHours(bellTimes[day][period][1].split(":")[0]);
                        endDate.setMinutes(bellTimes[day][period][1].split(":")[1]);

                        if (startDate <= currentDate && endDate >= currentDate) {
                            currentPeriod = [true, period]
                            foundPeriod = true
                        }
                    }
                }
            })
        } else {
            currentPeriod = [false]
        }
        resolve(currentPeriod)
    })
}

const nextPeriod = (day) => {
    return new Promise((resolve, reject) => {
        var currentPeriod = []
        let foundPeriod = false
        currentDate = new Date()
        if (bellTimes.hasOwnProperty(day)) {
            bellTimes.order[day].forEach(period => {
                if (bellTimes[day].hasOwnProperty(period)) {
                    if (!foundPeriod) {
                        startDate = new Date(currentDate.getTime());
                        startDate.setHours(bellTimes[day][period][0].split(":")[0]);
                        startDate.setMinutes(bellTimes[day][period][0].split(":")[1]);
                        if (startDate >= currentDate) {
                            currentPeriod = [true, period]
                            foundPeriod = true
                        }
                    }
                }
            })
        } else {
            currentPeriod = [false]
        }
        resolve(currentPeriod)
    })
}

// function markAttendance(timetable, week, day, period, interaction, editReply = false) {
//     if (!timetable.hasOwnProperty("loginPeiod") || timetable.loginPeiod !== period + "|" + day) {
//         timetable.loginPeiod = period + "|" + day
//         console.log(timetable.name + " | Period | " + period)
//         var url = "https://intranet.nbscmanlys-h.schools.nsw.edu.au/attendance/nbscmanlys-h." + timetable[week][day][period].code.replace(' ', '').toLowerCase() + "/mark"
//         console.log("signing into | " + url)
//         var request = require('request');
//         var jar = request.jar();
//         request = request.defaults({
//             jar: jar,
//             followAllRedirects: true
//         });
//         jar = request.jar();
//         request.post({
//             url: 'https://intranet.nbscmanlys-h.schools.nsw.edu.au/attendance/login',
//             headers: { 'content-type': 'application/x-www-form-urlencoded' },
//             method: 'post',
//             jar: jar,
//             body: timetable.password
//         }, function(err, res, body){
//             if(err) {
//                 return console.error(err);
//             }

//             request.post({
//                 url: url,
//                 method: 'post',
//                 jar: jar
//             }, function(err, res, body) {
//                 var cookies = jar.getCookies(url);
//                 console.log(cookies);
//                 if (editReply) {
//                     interaction.editReply(timetable.name + ", you have successfully logged into period " + period + ", " + timetable[week][day][period].name)
//                 } else {
//                     interaction.reply(timetable.name + ", you have successfully logged into period " + period + ", " + timetable[week][day][period].name)
//                 }
//             });
//         });
//     } else {
//         if (editReply) {
//             interaction.editReply(timetable.name + ", you have **already** logged into period " + period + ", " + timetable[week][day][period].name)
//         } else {
//             interaction.reply(timetable.name + ", you have **already** logged into period " + period + ", " + timetable[week][day][period].name)
//         }
//     }
// }

// Returns the ISO week of the date.
Date.prototype.getWeek = function() {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 -
        3 + (week1.getDay() + 6) % 7) / 7);
}