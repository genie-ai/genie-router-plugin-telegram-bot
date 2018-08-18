const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

let bot;
const allowedChatIds = {};
let passwordRequired = false;
let configuredPassword;
let parentRouter;
let parentRouterFunctions;

function setRouter(router) {
    parentRouterFunctions = router;
}

function isChatIdWhiteListed(chatId) {
    return allowedChatIds[chatId] === true;
}

async function isChattingAllowed(chatId) {
    if (!passwordRequired) {
        return true;
    } if (isChatIdWhiteListed(chatId)) {
        return true;
    }

    // check if persistent storage has already seen this user earlier.
    const storedValue = await parentRouterFunctions.storage.get(chatId, false);
    if (storedValue === false) {
        return false;
    }

    const check = crypto.createHash('sha256').update(chatId + configuredPassword).digest('base64');
    return check === storedValue;
}

function whitelistChatId(chatId) {
    allowedChatIds[chatId] = true;
    parentRouterFunctions.storage.put(chatId, crypto.createHash('sha256').update(chatId + configuredPassword).digest('base64'));
}

async function processTelegramTextMessage(msg, match) {
    const chatId = msg.chat.id;
    const heard = match[1]; // the captured "input"

    if (passwordRequired && heard === configuredPassword) {
        whitelistChatId(chatId);
        bot.sendMessage(chatId, 'Access is granted.');
        return;
    }

    const allowed = await isChattingAllowed(chatId);
    if (!allowed) {
        bot.sendMessage(chatId, 'Please send me the password first.');
        return;
    }

    parentRouter.heard({ input: heard, userId: msg.from.id, sessionId: chatId });
}

async function speak(message) {
    if (!message.sessionId) {
        throw new Error('No sessionId in message.');
    }

    bot.sendMessage(message.sessionId, message.output);
}

async function start(config, router) {
    if (!config.token) {
        throw new Error('No Telegram token provided.');
    }
    if (config.password) {
        passwordRequired = true;
        configuredPassword = config.password;
    }
    parentRouter = router;

    bot = new TelegramBot(config.token, { polling: true });
    // capture every message sent
    bot.onText(/(.+)/, processTelegramTextMessage);

    return { speak };
}

module.exports = { start, setRouter };
