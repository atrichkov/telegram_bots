const fs = require('fs')
const Path = require('path')  
require('dotenv').config()
const axios = require("axios")
const { Telegraf } = require('telegraf')

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

let chatId
bot.command('start', ctx => {
    chatId = ctx.chat.id
    bot.telegram.sendMessage(ctx.chat.id, 'Hello there! \nI respond to /bitcoin or /ethereum. Please try it.', {})

    let tickTock
    if (process.env.PRICE_NOTIFICATION_ENABLED && chatId) {
        if (tickTock) { clearInterval(tickTock) }
        tickTock = setInterval(() => {
            let rate
            axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`)
            .then(response => {
                rate = response.data.bitcoin
                const message = `Hello, price update .. $${rate.usd.toLocaleString()} 💰`
                bot.telegram.sendMessage(chatId, message)
            })
        }, process.env.PRICE_NOTIFICATION_INTERVAL*60*60*1000);
    }
})

bot.command('bitcoin', ctx => {
    let rate
    axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`)
    .then(response => {
        rate = response.data.bitcoin
        const message = `Hello, current bitcoin price is $${rate.usd.toLocaleString()} 💰`
        ctx.reply(message)
    })
})

bot.command('ethereum', ctx => {
    let rate
    axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`)
    .then(response => {
        rate = response.data.ethereum
        const message = `Hello, current ethereum price is $${rate.usd.toLocaleString()} 💰`
        ctx.reply(message)
    })
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))