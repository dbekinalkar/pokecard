require("dotenv").config();

const bot = require("./bot/bot.js");
const server = require("./server/server.js");

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

bot.start(token, clientId);

server.start();
