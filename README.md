This is a plugin for the [https://github.com/matueranet/genie-router](genie-router)
project. The [Telegram bot API](https://core.telegram.org/bots/api) is used as a client for input.

# Setup

Simply follow the instructions on the Telegram bot API explanation page to acquire a token for your bot. Place that token
in your client configuration, for example:

```json
{
  "plugins": {
    "telegram-bot": {
      "token": "<token goes here>",
      "password": "genie"
    }
  }
}
```

The password configuration attribute is optional, and can be used to require a password
before someone can send commands via Telegram. A hash of the password is stored in the
persistent storage, so that the user can be automatically granted access in a next session.
A user has to type the password anew when the password changes in the configuration.

To not require a password, simply remove the attribute or set it to null.
