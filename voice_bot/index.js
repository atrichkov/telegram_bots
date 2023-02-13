const fs = require('fs')
const Path = require('path')  
require('dotenv').config()
const axios = require("axios")
const { Telegraf } = require('telegraf')
const { message } = require('telegraf/filters');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
bot.catch((err, ctx) => {
    console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

bot.command('start', ctx => {
    bot.telegram.sendMessage(ctx.chat.id, 'Hey soldier, send me a voice message with your coordinates.', {})
})

bot.on(message('voice'), async ctx => {
    console.info('Voice message recived')

    try {
        const {file_id: fileId} = ctx.update.message.voice
        const fileUrl = await ctx.telegram.getFileLink(fileId)
        const path = Path.resolve(__dirname, './voices', Date.now()+'.mp3')
        const writer = fs.createWriteStream(path)
        const response = await axios.get(fileUrl, {responseType: 'stream'})

        response.data.pipe(writer)
        ctx.reply('Copy that!')
    } catch(err) {
        console.error(err)
    }
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))