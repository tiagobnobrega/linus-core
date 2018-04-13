const builder = require('botbuilder');
const _ = require('lodash');
const lais = require('../lais');
const dictionaryDefinitions = require('../test-dictionary');
const laisDictionary = lais.Dictionary(dictionaryDefinitions);

class MessageBuilder {
  build(reply, addr, context, scripts) {
    if (this.isTextReply(reply)) {
      return this.buildTextReply(reply, addr, context);
    } else if (this.isMediaReply(reply)) {
      return this.buildMediaReply(reply, addr, context);
    } else if (this.isChoiceReply(reply)) {
      return this.buildChoiceReply(reply, addr, context);
    } else if (this.isCarouselReply(reply)) {
      return this.buildCarouselReply(reply, addr, context);
    } else if (this.isFunctionReply(reply)) {
      return this.buildFunctionReply(reply, addr, context, scripts);
    } else {
      throw new Error(
        'Tipo de resposta não suportado: ' +
          typeof reply +
          '. A resposta deve ser uma String (texto) ou um objeto (escolha ou mídia).'
      );
    }
  }

  buildTextReply(reply, addr, context) {
    let msg = new builder.Message().address(addr),
      msgContent = this.getTextReplyContent(reply);
    // msg.text(msgContent);
    msg.text(laisDictionary.resolveWithContext(msgContent, context));
    msg.textLocale('pt-BR');
    return msg;
  }

  getTextReplyContent(reply) {
    if (_.isObject(reply)) {
      return reply.content;
    } else return reply;
  }

  buildMediaReply(reply, addr, context) {
    let meta = reply.meta || {};
    let layout = meta.layout || builder.AttachmentLayout.list;

    if (!_.isArray(reply.content)) {
      reply.content = [reply.content];
    }

    return new builder.Message()
      .address(addr)
      .attachmentLayout(layout)
      .attachments(reply.content);
  }

  buildCarouselReply(reply, addr, context) {
    let arrAttachments = [],
      currentCard,
      carousel;

    for (let i = 0; i < reply.content.length; i++) {
      currentCard = new builder.HeroCard()
        .title(reply.content[i].title)
        .text(reply.content[i].text)
        .images([builder.CardImage.create(null, reply.content[i].image)])
        .buttons([
          builder.CardAction.openUrl(
            null,
            reply.content[i].buttonLink,
            reply.content[i].buttonText
          ),
        ]);

      arrAttachments.push(currentCard);
    }

    return new builder.Message()
      .address(addr)
      .attachmentLayout(builder.AttachmentLayout.carousel)
      .attachments(arrAttachments);
  }

  buildChoiceReply(reply, addr, context) {
    if (_.isString(reply.content)) {
      reply.content = _.split(reply.content, '\n');
    }

    let meta = reply.meta || {};
    let layout = meta.layout || builder.AttachmentLayout.list;

    let message = new builder.Message().address(addr).attachmentLayout(layout);

    let card = new builder.HeroCard(null);

    if (meta.title) {
      card = card.title(meta.title.toString());
    }
    if (meta.subtitle) {
      card = card.subtitle(meta.subtitle.toString());
    }
    if (meta.text) {
      card = card.text(meta.text.toString());
    }

    let cardActions = reply.content.map(replyContent => {
      let text, value;

      if (_.isString(replyContent)) {
        text = value = replyContent;
      } else if (_.isObject(replyContent)) {
        if (replyContent.text) {
          // text = replyContent.text;
          text = laisDictionary.resolveWithContext(replyContent.text, context);
        } else {
          text = 'Não definido';
        }

        if (replyContent.value) {
          // value = replyContent.value;
          value = laisDictionary.resolveWithContext(
            replyContent.value,
            context
          );
        } else {
          value = text;
        }
      } else {
        throw new Error(
          'Opção inválida para resposta do tipo escolha. ' +
            'Deve-se fornecer um objeto (com as propriedades text e value) ou uma string.'
        );
      }

      return builder.CardAction.imBack(null, value, text);
    });

    return message.attachments([card.buttons(cardActions)]);
  }

  buildFunctionReply(reply, addr, context, scripts) {
    reply = reply.content({ context, scripts });

    return this.build(reply, addr, context, scripts);
  }

  isTextReply(reply) {
    return _.isString(reply) || reply.type == 'text';
  }

  isMediaReply(reply) {
    return _.isObject(reply) && reply.type == 'media';
  }

  isChoiceReply(reply) {
    return _.isObject(reply) && reply.type == 'choice';
  }

  isCarouselReply(reply) {
    return _.isObject(reply) && reply.type == 'carousel';
  }

  isFunctionReply(reply) {
    return _.isObject(reply) && reply.type == 'function';
  }

  getType(reply) {
    if (this.isTextReply(reply)) {
      return 'Texto';
    } else if (this.isMediaReply(reply)) {
      return 'Mídia';
    } else if (this.isChoiceReply(reply)) {
      return 'Escolha';
    } else if (this.isCarouselReply(reply)) {
      return 'Carrossel';
    } else if (this.isFunctionReply(reply)) {
      return 'Função';
    }
  }
}

module.exports = MessageBuilder;
