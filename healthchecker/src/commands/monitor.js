'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');

module.exports = function (ctx, checkInterval, urlsFilePath) {
  checkInterval = setInterval(() => {
    fs.readFile(urlsFilePath, (err, data) => {
      if (err) throw err;

      const list = JSON.parse(data.toString());
      list.forEach(url => {
        (url.indexOf('https') === 0 ? https : http)
          .get(url, res => {})
          .on('error', err => {
            clearInterval(checkInterval);
            ctx.reply(`🔥🔥🔥 ${url} is down 🔥🔥🔥`, {
              parse_mode: 'Markdown',
              disable_web_page_preview: true,
            });
          });
      });
    });
  }, (process.env.CHECK_INTERVAL || 120) * 1000);

  return checkInterval;
};
