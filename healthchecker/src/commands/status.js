'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');

module.exports = function (ctx, urlsFilePath) {
    fs.readFile(urlsFilePath, (err, data) => {
        if (err) throw err;

        const list = JSON.parse(data.toString());
        list.forEach((url) => {
            (url.indexOf('https') === 0 ? https : http)
                .get(url, (res) => {
                    let healthcheckData = '';
                    res.setEncoding('utf8');

                    res.on('data', (chunk) => {
                        healthcheckData += chunk;
                    });

                    res.on('end', () => {
                        let formattedJson = '';
                        const jsonData = { url, ...JSON.parse(healthcheckData) };

                        Object.keys(jsonData).forEach((key) => {
                            formattedJson += `${key}: ${jsonData[key]}\n`;
                        });

                        return ctx.replyWithHTML(`<pre>${formattedJson}</pre>`);
                    });
                })
                .on('error', (err) => {
                    console.error(err);
                });
        });
    });
};
