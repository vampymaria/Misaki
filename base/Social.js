const Command = require(`${process.cwd()}/base/Command.js`);
const { MessageEmbed } = require("discord.js");
const { version } = require(`${process.cwd()}/package.json`);
const moment = require("moment");
const { get } = require("snekfetch");

class Social extends Command {

  constructor(client, options) {
    super(client, Object.assign(options, {
      guildOnly: true
    }));
  } 

  async verifySocialUser(message, user) {
    try {
      const check = await this.verifyUser(message, user);
      if (!check) return;
      return [check.bot ? true : false, check];
    } catch (error) {
      this.client.logger.error(error);
      // this.client.logger.error(error);
    }
  }


  async usrDay(message) {
    const dailyTime = parseInt(message.settings.dailyTime);
    let pointsReward = parseInt(message.settings.pointsReward);
    const score = message.member.score;
    const { body } = await get(`https://discordbots.org/api/bots/${this.client.user.id}/check?userId=${message.author.id}`).set("Authorization", process.env.DBLTOKEN);
        
    try {
      if (Boolean(body.voted)) pointsReward += 750; // eslint-disable-line no-extra-boolean-cast
      if (!body.voted) {
  
        const embed = new MessageEmbed()
          .setAuthor(message.author.username, message.author.displayAvatarURL)
          .setDescription(`Have you upvoted today?\n\nAn upvote will net you an additional ₲750 to your daily claim **on every guild** you share with Misaki.\n\nClick [Here](https://discordbots.org/bot/${this.client.user.id}/vote) to upvote for the bonus.\n\nDo you wish to claim your daily anyway? (**y**es | **n**o)\n\nReply with \`cancel\` to cancel the message. The message will timeout after 60 seconds.`)
          .setTimestamp();
  
        const filter = m => m.author.id === message.author.id;
        const response = await message.client.awaitReply(message, "", filter, 60000, embed);
    
        if (["yes", "y", "confirm"].includes(response)) {
          if (Date.now() > score.daily) {
            const msg = await message.channel.send(`${this.client.responses.dailySuccessMessages.random().replaceAll("{{user}}", message.member.displayName).replaceAll("{{amount}}", `₲${pointsReward.toLocaleString()}`)}`);
            score.daily = msg.createdTimestamp + (dailyTime * 60 * 60 * 1000);
            message.member.givePoints(pointsReward);
            return msg;

          } else {
            const fromNow = moment(score.daily).fromNow(true);
            message.channel.send(`${this.client.responses.dailyFailureMessages.random().replaceAll("{{user}}", message.member.displayName).replaceAll("{{time}}", fromNow)}.`);
          
          }
        } else
      
        if (["no", "n", "cancel"].includes(response)) {
          message.channel.send("Claim cancelled.");
        } else {
          message.channel.send("Invalid response, please try again.");
        }
      } else {
        if (Date.now() > score.daily) {
          const msg = await message.channel.send(`${this.client.responses.dailySuccessMessages.random().replaceAll("{{user}}", message.member.displayName).replaceAll("{{amount}}", `₲${pointsReward.toLocaleString()}`)}`);
          score.daily = msg.createdTimestamp + (dailyTime * 60 * 60 * 1000);
          message.member.givePoints(pointsReward);
          return msg;

        } else {
          const fromNow = moment(score.daily).fromNow(true);
          message.channel.send(`${this.client.responses.dailyFailureMessages.random().replaceAll("{{user}}", message.member.displayName).replaceAll("{{time}}", fromNow)}.`);
        
        }
      }

    } catch (error) {
      this.client.logger.error(error);
      // this.client.logger.error(error);
    }
  }

  async usrPay(message, payer, payee, amount) {
    const getPayee = message.guild.member(payee);
    const getPayer = message.guild.member(payer);
    const payerScore = getPayer.score;

    try {
      if (payerScore.points < parseInt(amount)) {
        message.response(undefined, `Insufficient funds, you have ₲${payerScore.points}`);
        return;
      }
      const filter = m => m.author.id === message.author.id;
      const response = await message.client.awaitReply(message, `Are you sure you want to pay ${getPayee.displayName} ₲${parseInt(amount)}?\n\n(**y**es | **n**o)\n\nReply with \`cancel\` to cancel the message. The message will timeout after 60 seconds.`, filter, 60000, null);

      if (["yes", "y", "confirm"].includes(response.toLowerCase())) {
        getPayer.takePoints(parseInt(amount));
        getPayee.givePoints(parseInt(amount));
        await message.channel.send(`The payment of ₲${parseInt(amount)} has been sent to ${getPayee.displayName}.`);
      } else
    
      if (["no", "n", "cancel"].includes(response.toLowerCase())) {
        message.channel.send("Payment cancelled");
      } else {
        message.channel.send("Invalid response, please try again.");
      }
    
    } catch (error) {
      // console.log(error.stack);
      this.client.logger.error(error);
    }

  }

  async cmdPay(message, user, cost) {
    try {
      const [bot, _user] = await this.verifySocialUser(message, user); // eslint-disable-line no-unused-vars
      const getPayee = message.guild.member(_user.id);
      const score = getPayee.score;
      if (cost > score.points) {
        message.response(undefined, `Insufficient funds, you need ₲${cost}. Your current balance: ₲${score.points}`);
        return false;
      }
      getPayee.takePoints(cost);
      this.client.points.set(getPayee.fullId, score);
      return true;
    } catch (error) {
      this.client.logger.error(error);
    }
  }

  async cmdRew(message, user, amount) {
    try {
      const getPayee = message.guild.member(user);
      getPayee.givePoints(parseInt(amount));
      await message.channel.send(`Awarded ₲${parseInt(amount)} to ${message.guild.member(user).displayName}.`);
      return;
    } catch (error) {
      this.client.logger.error(error);
    }
  }

  async cmdPun(message, user, amount) {
    try {
      const getPayee = message.guild.member(user);
      getPayee.takePoints(parseInt(amount));
      await message.channel.send(`Deducted ₲${parseInt(amount)} from ${message.guild.member(user).displayName}.`);
      return;
    } catch (error) {
      this.client.logger.error(error);
    }
  }

  async cmdWeeb(type, imgType, nsfw = false) {
    const { body } = await get(`https://api.weeb.sh/images/random?type=${type}&filetype=${imgType}&nsfw=${nsfw}`)
      .set("Authorization", `Wolke ${process.env.WEEBSH}`)
      .set("User-Agent", `Misaki/${version}/${this.client.user.id === "396323622953680910" ? "Production" : "Development"}`);
    return body.url;
  }
}

module.exports = Social;
