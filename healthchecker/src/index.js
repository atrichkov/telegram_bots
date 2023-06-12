'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const { add, status } = require('./commands');
const commandArgsMiddleware = require('./commandArgs');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!');
}
const bot = new Telegraf(token);
const urlsFilePath = path.join(__dirname, 'data.json');

bot.use(commandArgsMiddleware());

/**
 * @param {Object} ctx
 * @param {string} message
 */
function reply(ctx, message) {
  ctx.reply(message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });
}

function getUrlsList() {
  let existingData = [];
  if (fs.existsSync(urlsFilePath)) {
    const fileData = fs.readFileSync(urlsFilePath);
    existingData = JSON.parse(fileData.toString());
  }

  return existingData;
}

bot.command('start', (ctx) => {
  bot.telegram.sendMessage(
    ctx.chat.id,
    `👋 Hello! I am your Health Check Monitor Bot.
      
        I will keep an eye on your services and notify you if any issues are detected.

        To get started, please provide the URLs of the services you want me to monitor.

        Use the command:
        /add <URL>
          
        For example:
        /add https://example.com

        To view the list of urls for monitoring
        /list

        To view the status of monitored services, use the command:
        /status

        To stop updates for monitored services, use the command:
        /stop

        Happy monitoring!`,
    {}
  );
});

bot.command('add', (ctx) => {
  try {
    add(ctx, getUrlsList(), urlsFilePath);
  } catch (err) {
    console.error('Error: ', err);
  }
});

bot.command('list', (ctx) => {
  const existingData = getUrlsList();

  let msg = '';
  for (let i in existingData) {
    msg += `${i}. ${existingData[i]}\n`;
  }

  return reply(ctx, msg);
});

let checkInterval;
bot.command('status', (ctx) => {
  checkInterval = status(ctx, checkInterval, urlsFilePath);
});

bot.command('stop', (ctx) => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }

  return reply(ctx, 'Monitoring is stoped use /status to run it again!');
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
