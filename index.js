process.env.NTBA_FIX_319 = 1; // suppress the deprecation warning (https://github.com/yagop/node-telegram-bot-api/issues/319)
const client = require('./lib/client');

module.exports = {
    client,
    setRouter: client.setRouter.bind(client),
};
