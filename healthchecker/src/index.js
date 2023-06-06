require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Telegraf } = require('telegraf');
const commandArgsMiddleware = require('./commandArgs')

const token = process.env.TELEGRAM_BOT_TOKEN;
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!');
}
const bot = new Telegraf(token);

bot.use(commandArgsMiddleware())

/**
 * @param {Object} ctx
 * @param {string} message
 */
function reply(ctx, message) {
  ctx.reply(message, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  })
}

bot.command('add', (ctx) => {
  try {
    if (ctx.state.command) {
      if (!ctx.state.command.args.length) {
        return reply(ctx, 'You must provide at least one url to begin monitoring!')
      }

      let existingData = [];
      try {
        const fileData = fs.readFileSync(path.join(__dirname, 'data.json'));
        existingData = JSON.parse(fileData.toString());
      } catch {}

      fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify([...existingData, ...ctx.state.command.args]), err => {
        if (err) {
            return console.error(err);
        }
      });
    }
  } catch (err) {
    console.error('Error: ', err)
  }
})

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

        To view the status of monitored services, use the command:
        /status

        Happy monitoring!`,
    {}
  );
});

let checkInterval;
bot.command('status', (ctx) => {
  checkInterval = setInterval(() => {
    fs.readFile(path.join(__dirname, 'data.json'), (err, data) => {
      if (err) throw err;
      
      const list = JSON.parse(data.toString());
      list.forEach(url => {   
        (url.indexOf('https') === 0 ? https : http)
          .get(process.env.HEALTHCHECK_URL, (res) => {
            let data = '';
            res.setEncoding('utf8');

            res.on('data', (chunk) => {
              data += chunk;
            });

            res.on('end', () => {
              let formattedJson = '';
              const jsonData = {url, ...JSON.parse(data)};
            
              Object.keys(jsonData).forEach((key) => {
                formattedJson += `${key}: ${jsonData[key]}\n`;
              });
            
              return ctx.replyWithHTML(`<pre>${formattedJson}</pre>`);
            });
          })
          .on('error', (err) => {
            console.log(err);
            clearInterval(checkInterval);
          });
      });
    });
  }, (process.env.CHECK_INTERVAL || 120) * 1000);
});

bot.command('stop', (ctx) => {
  if (checkInterval) {
    clearInterval(checkInterval);
  }

  return reply(ctx, 'Monitoring is stoped use /status to run it again!')  
})

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
