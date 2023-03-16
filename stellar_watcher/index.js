require('dotenv').config()
const { Telegraf } = require('telegraf')
const commandArgsMiddleware = require('./commandArgs');
const StellarSdk = require('stellar-sdk');

const token = process.env.TELEGRAM_BOT_TOKEN
if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}
const bot = new Telegraf(token)

bot.use(commandArgsMiddleware());

let chatId
bot.command('start', ctx => {
    let chatId = ctx.chat.id
    bot.telegram.sendMessage(ctx.chat.id, 'Hello there! \nI respond to /subscribe command followed by valid address. Please try it.', {})
})

bot.command('subscribe', async ctx => {
    console.debug(ctx.state.command) // command object
    let address = null
    if (ctx.state.command) {
        address = ctx.state.command.args[0]
    }

    if (address) {
        const server = new StellarSdk.Server(process.env.NODE)

        server
            .payments()
            .forAccount(address)
            .cursor('now')
            .stream({
                onmessage: payment => {
                    const send = {
                        address: null,
                        asset: null,
                        amount: null
                    }
                    const received = {
                        address: null,
                        asset: null,
                        amount: null
                    }
    
                    if (payment.type === 'payment') {
                        send.address = payment.from
                        send.asset = payment.asset_code ? payment.asset_code : 'XLM'
                        send.amount = payment.amount
    
                        received.address = payment.to
                        received.asset = send.asset
                        received.amount = payment.amount
                    } else if (['path_payment_strict_send', 'path_payment_strict_receive'].includes(payment.type)) {
                        send.address = payment.from
                        send.asset = payment.source_asset_code ? payment.source_asset_code : 'XLM'
                        send.amount = payment.source_amount
    
                        received.address = payment.to
                        received.asset = payment.asset_code ? payment.asset_code : 'XLM'
                        received.amount = payment.amount
                    }
    
                    message = `New [payment](https://stellar.expert/explorer/public/tx/${payment.transaction_hash}) received: transfered ${send.amount} ${send.asset} -> ${received.amount} ${received.asset} to [${received.address}](https://stellar.expert/explorer/public/account/${received.address})`
                    ctx.reply(message, {
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true
                    })
                },
                onerror: (error) => {
                    console.log("An error occurred!");
                    console.log(error);
                }
            })
    } else {
        ctx.reply("Please provide the address that you want to subscribe to.")
    }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))