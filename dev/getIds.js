var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
const { loginCreds } = require('./config.json');

let url = 'https://timetable.nbscmanlys-h.schools.nsw.edu.au/97c9768f-1601-4f84-89ba-0c062d66c0d3'

var jar = request.jar();
request = request.defaults({
    jar: jar,
    followAllRedirects: true
});
jar = request.jar();

let namesToId = {}
let nameIdList = []
let bothNameIdList = []

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

        $('div#student-entries > a').each(function(idx, studentAtag) {
            const studentURL = $(studentAtag).attr('href')
            const studentName = $(studentAtag).find('span').text().trim().replace(/\u00a0/g, ' ')
            const id = studentURL.split('/')[2]
            namesToId[studentName.toLowerCase()] = id
            nameIdList.push([studentName, id])
            bothNameIdList.push([studentName, id])
        })

        $('div#teacher-entries > a').each(function(idx, teacherAtag) {
            const teacherURL = $(teacherAtag).attr('href')
            const teacherName = $(teacherAtag).find('span').text().trim().replace(/\u00a0/g, ' ')
            const id = teacherURL.split('/')[2]
            namesToId[teacherName.toLowerCase()] = id
            bothNameIdList.push([teacherName, id])
        })

        var cookies = jar.getCookies(url);
        console.log(cookies);
        fs.writeFile("/var/node/OggyPbot/resources/both/nameToId.json", JSON.stringify(namesToId), (err) => {
            if (err) console.log(err);
            console.log("Wrote nameToId.json file");
        });
        fs.writeFile("/var/node/OggyPbot/resources/students/nameIdList.json", JSON.stringify(nameIdList), (err) => {
            if (err) console.log(err);
            console.log("Wrote nameIdList.json file");
        });
        fs.writeFile("/var/node/OggyPbot/resources/both/nameIdList.json", JSON.stringify(bothNameIdList), (err) => {
            if (err) console.log(err);
            console.log("Wrote nameIdList.json file");
        });
    });
});