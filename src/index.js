const { token, clientId } = require("../config.json");
const { client, deployCommands} = require("./bot/bot.js");

client.login(token);
deployCommands(token, clientId);
