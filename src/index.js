const { token, clientId } = require("../config.json");
const { client, deployCommands} = require("./bot/bot.js");
const server = require("./server/server.js");

client.login(token);
deployCommands(token, clientId);

server.start();