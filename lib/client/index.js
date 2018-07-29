const TelegramBot = require('node-telegram-bot-api')
var crypto = require('crypto');

let bot
let allowedChatIds = {}
let passwordRequired = false
let configuredPassword
let parentRouter
let parentRouterFunctions;

function start (config, router) {
  return new Promise(function (resolve, reject) {
    if (!config.token) {
      reject(new Error('No Telegram token provided.'))
    }
    if (config.password) {
      passwordRequired = true
      configuredPassword = config.password
    }
    parentRouter = router

    bot = new TelegramBot(config.token, { polling: true })
    // capture every message sent
    bot.onText(/(.+)/, processTelegramTextMessage)

    resolve({speak: speak})
  })
}

function setRouter(router) {
  parentRouterFunctions = router;
}

function processTelegramTextMessage (msg, match) {
  var chatId = msg.chat.id
  var heard = match[1] // the captured "input"

  if (passwordRequired && heard === configuredPassword) {
    whitelistChatId(chatId)
    bot.sendMessage(chatId, 'Access is granted.')
    return
  }

  isChattingAllowed(chatId)
    .then(function(allowed) {
      if (!allowed) {
        bot.sendMessage(chatId, 'Please send me the password first.')
        return
      }

      parentRouter.heard({input: heard, userId: msg.from.id, sessionId: chatId})
    })
}

function isChattingAllowed(chatId) {
  if (!passwordRequired) {
    return Promise.resolve(true);
  } else if (isChatIdWhiteListed(chatId)) {
    return Promise.resolve(true);
  }

  // check if persistent storage has already seen this user earlier.
  return parentRouterFunctions.storage.get(chatId, false)
    .then(function (storedValue) {
      if (storedValue === false) {
        return false;
      }

      const check = crypto.createHash('sha256').update(chatId + configuredPassword).digest('base64');
      return check === storedValue;
    })
}

function whitelistChatId (chatId) {
  allowedChatIds[chatId] = true
  parentRouterFunctions.storage.put(chatId, crypto.createHash('sha256').update(chatId + configuredPassword).digest('base64'))
}

function isChatIdWhiteListed (chatId) {
  return allowedChatIds[chatId] === true
}

function speak (message) {
  return new Promise(function (resolve, reject) {
    if (!message.sessionId) {
      reject(new Error('No sessionId in message.'))
    }

    bot.sendMessage(message.sessionId, message.output)
    resolve()
  })
}

module.exports = {start: start, setRouter: setRouter}
