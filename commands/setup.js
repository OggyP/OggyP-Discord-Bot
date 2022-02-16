const prompt = require('prompt-sync')();
var fs = require('fs').promises;

fs.writeFile('data/timetables.json', '{}')

console.log("Please answer the following questions to get set up.")

let config = {}

config.cliendId = prompt('What is your Discord Bot clientId: ');
config.guildId = prompt('What is your Discord Bot guildId: ');
config.token = prompt('What is your Discord Bot token: ');

let DoEusername = prompt('What is your NSW DoE username: ');
let DoEpassword = prompt('What is your NSW DoE password: ');
config.loginCreds = `username=${DoEusername}&password=${DoEpassword}`

config.snakeDatabase = {}
config.snakeDatabase.username = prompt('What is your OggyP Snake Server Database username: ');
config.snakeDatabase.password = prompt('What is your OggyP Snake Server Database password: ');

config.chessDatabase = {}
config.chessDatabase.username = prompt('What is your OggyP Chess Server Database username: ');
config.chessDatabase.password = prompt('What is your OggyP Chess Server Database password: ');

console.log("You are now done!\nTo get all timetable info please run:\nnpm run getIds\nnpm run getClassList\nnpm run getClasses\n")
console.log("If you want to update the rebind all timetable info please re-run those commands and then run:\nnpm run rebind")

await fs.writeFile('config.json', JSON.stringify(config))
console.log("Your config file has been written.")