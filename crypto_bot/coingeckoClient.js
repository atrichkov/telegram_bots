'use strict'

const axios = require("axios")

class Api {
    constructor(currency) {
        this.currency = currency
    }

    async getAssetPrice(coin) {
        try {
            const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${this.currency}`)

            return response.data[coin]
        } catch (err) {
            console.log('aaaaaaa')
            console.error(err)
        }
    }
}

module.exports = Api
