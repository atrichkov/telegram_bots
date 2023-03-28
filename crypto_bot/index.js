'use strict'

require('dotenv').config()
const { Telegraf } = require('telegraf')
const Api = require('./coingeckoClient.js')

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

const api = new Api('usd')

let chatId
bot.command('start', (ctx) => {
  chatId = ctx.chat.id
  bot.telegram.sendMessage(
    ctx.chat.id,
    'Hello there! \nI respond to /bitcoin or /ethereum. Please try it.',
    {}
  )

  let tickTock
  if (process.env.PRICE_NOTIFICATION_ENABLED && chatId) {
    if (tickTock) {
      clearInterval(tickTock)
    }
    tickTock = setInterval(() => {
      const rate = api.getAssetPrice('bitcoin')
      const message = `Hello, price update .. $ ${rate.usd.toLocaleString()} 💰`

      bot.telegram.sendMessage(chatId, message)
    }, process.env.PRICE_NOTIFICATION_INTERVAL * 60 * 60 * 1000)
  }

  let lastPrice = null
  setInterval(async () => {
    const rate = await api.getAssetPrice('bitcoin')
    const percentageChange = (
      ((lastPrice - rate.usd) / lastPrice) *
      100
    ).toFixed(2)

    if (lastPrice && Math.abs(percentageChange) > 10)
      bot.telegram.sendMessage(
        chatId,
        `bitcoin price is changed by ${percentageChange}% to ${rate.usd}`
      )

    lastPrice = rate.usd
  }, 3 * 60 * 60)
})

bot.command('bitcoin', async (ctx) => {
  const rate = await api.getAssetPrice('bitcoin')
  const message = `Hello, current bitcoin price is $ ${rate.usd.toLocaleString()} 💰`
  ctx.reply(message)
})

bot.command('ethereum', async (ctx) => {
  const rate = await api.getAssetPrice('ethereum')
  const message = `Hello, current ethereum price is $ ${rate.usd.toLocaleString()} 💰`
  ctx.reply(message)
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
