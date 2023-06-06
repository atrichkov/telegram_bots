require('dotenv').config();
const https = require('https');
const cheerio = require('cheerio');
const { Telegraf } = require('telegraf');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (token === undefined) {
  throw new Error('BOT_TOKEN must be provided!');
}
const bot = new Telegraf(token);

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

bot.command('start', (ctx) => {
  bot.telegram.sendMessage(
    ctx.chat.id,
    'I began monitoring the for short-term loans.',
    {}
  );

  const checkInterval = setInterval(() => {
    const url = 'https://peerberry.com/';

    https
      .get(url, (res) => {
        let data = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          // fetch peerberry avaiable loans
          const $ = cheerio.load(data);
          let tableRows = $('.table__content').find('.table__row').toArray();
          for (const row of tableRows) {
            const cell = $(row).find('.table__cell');
            const loanCountry = cell.eq(1).text().trim().toLowerCase();
            const loanType = cell.eq(3).text().trim().toLowerCase();

            // const str = `${loanCountry} / ${loanType}`
            // console.debug(str)

            if (
              loanType === process.env.LOAN_TYPE &&
              process.env.LOAN_COUNTRIES.split(',').includes(loanCountry)
            ) {
              return reply(
                ctx,
                `New short term loans founded, check it out [here](${url})`
              );
            }
          }
        });
      })
      .on('error', (err) => {
        console.log(err);
        clearInterval(checkInterval);
      });
  }, 10 * 1000);
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
