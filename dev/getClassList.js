var fs = require('fs');
const { loginCreds } = require('./config.json');

var studentList = []

fs.readFile("/var/node/OggyPbot/resources/students/nameIdList.json", 'utf8', function(err, buf) {
    studentList = JSON.parse(buf.toString())
    addUser(0)
    addUser(1)
    addUser(2)
    addUser(3)
    addUser(4)
    addUser(5)
    addUser(6)
    addUser(7)
    addUser(8)
    addUser(9)
});

let classes = {}

const inc = 10

let done = [false, false, false, false, false, false, false, false, false, false]

function addUser(studentNum) {
    if (studentNum >= studentList.length) {
        done[studentNum % 10] = true
        for (let i = 0; i < inc; i++) {
            if (!done[i]) {
                console.log('done', studentNum % 10)
                return
            }
        }
        console.log('Done')
        fs.writeFile("/var/node/OggyPbot/resources/classList.json", JSON.stringify(classes), (err) => {
            if (err) console.log(err);
            console.log("Wrote new class list file");
        });
        return
    }
    const student = studentList[studentNum]
    console.log("Getting " + student[0])
    let url = 'https://timetable.nbscmanlys-h.schools.nsw.edu.au/97c9768f-1601-4f84-89ba-0c062d66c0d3/' + student[1]
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

                                classCode = $(tableData).find('small').text().trim().replace(/ /g, '.')
                                    // console.log(classCode)

                                if (!classes.hasOwnProperty(classCode)) {
                                    classes[classCode] = {
                                        name: $(tableData).find('strong').text().trim(),
                                        students: [student[0]],
                                        teachers: [classInfo[1]],
                                        rooms: [classInfo[2]],
                                        periods: [week + ' ' + day.toString() + ' ' + classInfo[0]]
                                    }
                                } else {
                                    if (!classes[classCode].students.includes(student[0])) classes[classCode].students.push(student[0])
                                    if (!classes[classCode].teachers.includes(classInfo[1])) classes[classCode].teachers.push(classInfo[1])
                                    if (!classes[classCode].rooms.includes(classInfo[2])) classes[classCode].rooms.push(classInfo[2])
                                    if (!classes[classCode].periods.includes(week + ' ' + day.toString() + ' ' + classInfo[0])) classes[classCode].periods.push(week + ' ' + day.toString() + ' ' + classInfo[0])
                                }
                            }
                        day++
                    })
                })
                week = 'b'
            })
            addUser(studentNum + inc)
        });
    });
}