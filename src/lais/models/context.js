const _ = require('lodash');
const sha1 = require('sha1');
const defaultDialog = {
  id: 'ROOT',
  minConfidence: 0.6,
  listenTo: ['intents', 'entities'],
};
class Context {
  constructor(options) {
    this.userId = options.userId || `UndefinedUser-${new Date().getTime()}`; //TODO Avaliar impacto
    this.userName = options.userName;

    if (this.userName) {
      this.userFirstName = this.userName.split(' ')[0];
    }

    // TODO Avaliar impacto
    // if(!this.userId) {
    //   throw new Error('O id do usuário é uma informação obrigatória para o contexto');
    // }

    this.id = options.id || `${new Date().getTime()}${sha1(this.userId)}`;
    this.intents = options.intents || [];
    this.entities = options.entities || {};
    this._dialog = options._dialog || defaultDialog;
    this.lastRules = options.lastRules || [];
    this.repeatCount = options.repeatCount || 0;
    this.userMessage = options.userMessage || null;
    this.lastMessageTime = options.lastMessageTime || null;
    this.conversationExpirationLimit =
      options.conversationExpirationLimit || 7200;
    this.__created = options.__created || new Date();

    _.merge(this, options);
  }

  isExpired() {
    if (!this.lastMessageTime) {
      return false;
    } else {
      return (
        new Date() - this.lastMessageTime >
        this.conversationExpirationLimit * 1000
      );
    }
  }

  updateLastMessageTime() {
    this.lastMessageTime = new Date();
  }

  asPlainObject() {
    let plainObject = {};

    for (var property in this) {
      if (this.hasOwnProperty(property)) {
        plainObject[property] = this[property];
      }
    }

    return plainObject;
  }

  fromPlainObject(options) {
    return new Context(options);
  }
}

module.exports = Context;
