var fs = require("fs");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');

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

let eventsCalenderURL = 'https://sentral.nbscmanlys-h.schools.nsw.edu.au/webcal/calendar/65?type=ical'
let downloadedEvents = false;

let events = []
let nextEvents = []

downloadEvents(eventsCalenderURL)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('Get events that are scheduled for school!')
        .addSubcommand(subCommand =>
            subCommand.setName('next')
            .setDescription('Will tell you of the first 10 events up coming.')
        )
        .addSubcommand(subCommand =>
            subCommand.setName('num')
            .setDescription('Will tell of an event of a specific number.')
            .addIntegerOption(option =>
                option.setName('number')
                .setDescription('The event number.')
                .setRequired(true)
            )
        ),

    async execute(interaction) {
        await interaction.deferReply();
        if (interaction.options.getSubcommand() === 'num')
            sendEvent(interaction, interaction.options.getInteger('number'))
        if (interaction.options.getSubcommand() === 'next')
            sendNextTen(interaction)
    },
};

function downloadEvents(url) {
    var request = require('request');
    var jar = request.jar();
    request = request.defaults({
        followAllRedirects: true
    });

    request.get({
        url: url,
        method: 'get',
        jar: jar,
    }, function(err, res, body) {
        if (err) {
            return console.error(err);
        }

        lines = body.split('\n');

        let beginType = null
        let previousType = null
        let toBeElement = {}

        let now = new Date()
        lines.forEach(line => {
            line = line.replace('\r', '')
            if (line.startsWith('DT')) {
                // DATE
                let dateTypeInfo = line.split(';')
                if (beginType === 'VEVENT') {
                    let lineInfo = dateTypeInfo[1].split(':')
                    let dateType = (dateTypeInfo[0] === 'DTSTART') ? 'start' : 'end'
                        // 2022 06 15T10 00 00Z
                        // 2022 06 14
                    if (lineInfo[0] === 'VALUE=DATE-TIME')
                        toBeElement[dateType] = new Date(lineInfo[1].slice(0, 4) + '-' + lineInfo[1].slice(4, 6) + '-' + lineInfo[1].slice(6, 11) + ':' + lineInfo[1].slice(11, 13) + ':' + lineInfo[1].slice(13, 16))
                    else
                        toBeElement[dateType] = new Date(lineInfo[1].slice(0, 4) + '-' + lineInfo[1].slice(4, 6) + '-' + lineInfo[1].slice(6, 8))
                    if (dateType === 'end' && nextEvents.length < 10 && now <= toBeElement.end) toBeElement.nextTen = true
                }
            } else {
                let lineInfo = line.split(':')
                if (lineInfo.length === 1 && beginType === 'VEVENT') {
                    toBeElement[previousType] += line
                } else {
                    if (lineInfo[0] === 'BEGIN') {
                        beginType = lineInfo[1]
                        toBeElement = {}
                    } else if (lineInfo[0] === 'END') {
                        events.push(toBeElement)
                        if (toBeElement.hasOwnProperty('nextTen')) nextEvents.push(events.length - 1)
                    } else if (beginType === 'VEVENT') {
                        toBeElement[lineInfo[0]] = lineInfo[1]
                        previousType = lineInfo[0]
                    }
                }
            }
        });

    });
}

function sendEvent(interaction, eventId) {
    if (eventId < events.length) {
        interaction.editReply({ embeds: [createEventEmbed(events[eventId])] })
    } else {
        interaction.editReply('That event does not exist.')
    }
}

function sendNextTen(interaction) {
    var newEmbed = new MessageEmbed()
        .setColor('#00FF00')
        .setTitle('Next 10 Upcoming Events')
        .setAuthor(`OggyP Bot | NBSC Calender`, 'https://test.oggyp.com/school.png', 'https://chess.oggyp.com')
        .setTimestamp()
        .setFooter("Play https://chess.oggy.com | NBSC Manly Calender", 'https://test.oggyp.com/school.png');

    description = ''
    nextEvents.forEach(eventId => {
        description += formatEventAsText(events[eventId], eventId)
    })

    console.log(description)

    newEmbed.setDescription(description)

    interaction.editReply({ embeds: [newEmbed] })
}

function formatEventAsText(event, displayId = null) {
    let title = (event.hasOwnProperty('SUMMARY') && event.SUMMARY !== '') ? event.SUMMARY : (event.hasOwnProperty('DESCRIPTION') && event.DESCRIPTION !== '') ? event.DESCRIPTION : 'No Title'
    return `${(displayId != null) ? `**\`${displayId}\`** | ` : ''}${title} | Starts: ${event.start.toString().split(' GMT')[0]}\n`
}

function createEventEmbed(event) {
    let title = (event.hasOwnProperty('SUMMARY') && event.SUMMARY !== '') ? event.SUMMARY : (event.hasOwnProperty('DESCRIPTION') && event.DESCRIPTION !== '') ? event.DESCRIPTION : 'No Title'
    let description = (event.hasOwnProperty('DESCRIPTION') && event.DESCRIPTION !== '') ? event.DESCRIPTION : (event.hasOwnProperty('SUMMARY') && event.SUMMARY !== '') ? event.SUMMARY : 'No Description'
    var newEmbed = new MessageEmbed()
        .setColor('#00FF00')
        .setTitle(title)
        .setAuthor(`OggyP Bot | NBSC Calender`, 'https://test.oggyp.com/school.png', 'https://chess.oggyp.com')
        .setTimestamp()
        .setFooter(event.UID + " | NBSC Manly Calender", 'https://test.oggyp.com/school.png');
    
    if (description !== title) newEmbed.setDescription(description)

    newEmbed.addFields({ name: "Start Date", value: event.start.toString().split(' GMT')[0] });
    newEmbed.addFields({ name: "End Date", value: event.end.toString().split(' GMT')[0] });

    return newEmbed
}