const Social = require(`${process.cwd()}/base/Social.js`);

class Daily extends Social {
  constructor(client) {
    super(client, {
      name: "daily",
      description: "Claim your daily points.",
      usage: "daily",
      category: "Social",
      extended: "This command will redeem your guilds daily bonus.",
      cost: 0,
      aliases: ["claim"]
    });
  }

  async run(message, args, level) { // eslint-disable-line no-unused-vars
    if (message.settings.socialSystem !== "true") return message.response(undefined, "The social system is disabled.");

    try {
      await this.usrDay(message);
    } catch (error) {
      if (error.status === 502) message.channel.send(`My deepest apologes ${message.author}-san, but DBL is currently offline, please try again later.`);
      this.client.logger.error(error);
    }
  }
}

module.exports = Daily;