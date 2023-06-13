'use strict';

const fs = require('fs');

module.exports = function (ctx, existingData, urlsFilePath) {
  const { command, args } = ctx.state.command;

  if (command) {
    if (!args.length) {
      return reply(
        ctx,
        'You must provide at least one url to begin monitoring!'
      );
    }

    for (const url of args) {
      try {
        new URL(url);
      } catch (err) {
        return reply(
          ctx,
          `*${url}* is invalid, please provide list of valid urls!`
        );
      }
    }

    fs.writeFile(
      urlsFilePath,
      JSON.stringify([...existingData, ...args]),
      err => {
        if (err) {
          return console.error(err);
        }
      }
    );
  }
};
