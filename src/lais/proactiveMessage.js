const builder = require('botbuilder');
const MessageBuilder = require('./MessageBuilder');

const _validReplyTypes = ['text', 'media', 'choice', 'carousel', 'function'];

class proactiveMessage {
  static send(bot, addr, reply, context, scripts) {
    if (!this.replyValidation(reply)) throw new Error('Reply inválido');

    console.log('>>>>>>>>>>>>>>>>>>>>>>>> BOT', bot);

    let newMessage = this.buildMsg(reply, addr, context, scripts);
    bot.send(newMessage);
  }
  static noRulesSend(bot, addr, reply) {
    if (!reply) throw new Error('Mensagem inválida');

    let newMessage = this.buildMsg(reply, addr, null, null);
    bot.send(newMessage);
  }

  static buildMsg(reply, addr, context, scripts) {
    let plainContext = context ? context.asPlainObject() : {};
    let msg = new MessageBuilder().build(
      reply,
      addr,
      { context: plainContext },
      scripts
    );
    return msg;
  }

  static replyValidation(reply) {
    return (
      reply.hasOwnProperty('content') &&
      reply.hasOwnProperty('type') &&
      this.replyTypeValidation(reply)
    );
  }

  static replyTypeValidation(reply) {
    if (!reply.hasOwnProperty('type')) return false;
    return this.validReplyTypes.includes(reply.type);
  }

  static get validReplyTypes() {
    return _validReplyTypes;
  }
}

module.exports = proactiveMessage;
