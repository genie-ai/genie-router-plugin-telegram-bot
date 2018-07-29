const client = require('./lib/client')

module.exports = {
  client: client,
  setRouter: client.setRouter.bind(client),
}
