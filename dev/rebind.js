var fs = require('fs');
const { loginCreds } = require('./config.json');

let oldTimetables;
let timetables = {}

fs.readFile("data/timetables.json", 'utf8', function(err, buf) {
    oldTimetables = JSON.parse(buf.toString())

    console.log("Loaded timetables.json")

    Object.keys(oldTimetables).forEach(userId => {
        console.log("Starting rebinding of " + oldTimetables[userId].name + "'s timetable")
        let url = oldTimetables[userId].url
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
                    // console.log(body)
                var $ = cheerio.load(body);
                // console.log($('div > h2.text-secondary > small').text())

                let week = 'a'
                $('div > table').each(function(idx, table) {
                    $(table).find('tbody > tr').each(function(i, tableRow) {
                        // console.log(this)
                        let day = 1 // Monday
                        $(tableRow).children('td').each(function(j, tableData) {
                            // console.log(this)
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

                                    // console.log("Has " + day + ": " + " Period " + classInfo[0] + " | Teachers " + classInfo[1] + " | Room " + classInfo[2])
                                }
                            day++
                        })
                    })
                    week = 'b'
                })


                userTimetable.name = $('div > h2.text-secondary > small').text().split('(')[1].split(')')[0];
                userTimetable.url = url;

                // var cookies = jar.getCookies(url);
                // console.log(cookies);
                timetables[userId] = userTimetable
                console.log("Rebound " + oldTimetables[userId].name + "'s timetable")

            });
        });
    });
    setTimeout(function() {
        fs.writeFile("data/timetables.json", JSON.stringify(timetables), (err) => {
            if (err) console.log(err);
            console.log("Wrote new timetables file");
        });
        console.log("Finished Timetable Rebinding")
    }, 10000); //Delay 2 seconds
})