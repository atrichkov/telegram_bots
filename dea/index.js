require('dotenv').config()
const fs = require('fs')
const https = require('https')
const { Telegraf } = require('telegraf')
const commandArgsMiddleware = require('./commandArgs')

const token = process.env.TELEGRAM_BOT_TOKEN
if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}
const bot = new Telegraf(token)

bot.use(commandArgsMiddleware());

/**
 * @param {Object} ctx 
 * @param {string} message 
 */
function reply(ctx, message) {
    ctx.reply(message, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
    })
}

bot.command('start', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, 'Hello there! \nI respond to \n \
     /update command to load latest DEA list \
     /check command followed by valid email address. Please try it.', {})
})

bot.command('update', ctx => {
    const url = 'https://raw.githubusercontent.com/kslr/disposable-email-domains/master/list.json'
    const filename = 'list.json'

    try {
        https.get(url, res => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reply(ctx, 'New DEA list the cannot be downloaded!')
            }
    
            const writeStream = fs.createWriteStream(filename)
         
            res.pipe(writeStream)
         }).on('error', (err) => {
            fs.unlink(filename) // Delete the file async. (But we don't check the result)
            console.error(err.message)
            throw err;
         }).on('finish', () => {
    
         })
    } catch(err) {
        console.error(err)
        return reply(ctx, 'New DEA list the cannot be downloaded!')
    }
})

bot.command('check', async ctx => {
    try {
        console.debug(ctx.state.command) // command object
        let message = ''

        let email = null
        if (ctx.state.command) {
            if (!ctx.state.command.args.length) {
                return reply(ctx, 'Email is not provided!')
            }
            email = ctx.state.command.args[0].trim()
        }

        const t0 = performance.now();

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            message = 'Please provide valid email!'
            return reply(ctx, message)
        }

        const emailDomain = email.split('@')[1]
        const data = fs.readFileSync('list.json', 'utf8')

        if (data) {
            list = JSON.parse(data)

            if (list.includes(emailDomain)) {
                message = `${email} is disposable email`
            } else {
                message = `${email} is *not* disposable email`
            }
        }

        reply(ctx, message)

        const t1 = performance.now();
        console.log(`Call to doSomething took ${t1 - t0} milliseconds.`);
    } catch(err) {
        console.error('Error: ', err)
    }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))