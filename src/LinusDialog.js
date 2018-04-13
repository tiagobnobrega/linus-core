// const log = require('debug')('linus:linusDialog');
const _ = require('lodash');

const requiredParam = require('./utils/requiredParam');

// const CTX_ATTR = '_linus';
const LinusDialog = initArgs => {
  const me = {};
  let src = {};
  const messageTokenizers = {};

  /**
   * Initializes LinusDialog instace with initArgs
   */
  const init = () => {
    // perform initialization based on initArgs;
    // TODO: Transformar array topics e interactions em objeto
    // TODO: Objeto de interactions pode usar como chave <ID_TOPICO>:<ID_INTERACAO>
    const {
      bot = requiredParam('bot'),
      topics = [],
      interactions = [],
    } = initArgs;

    src = { bot, topics, interactions };
  };

  /**
   * Register tokenizer on instance
   * @param tokenizer - Object. {id: Tokenizer ID, fn: Tokenizer function (message:String)=>tokens:Object}
   * @param overwrite - Boolean. Overwrite previous tokenizer registered with same id ?
   */
  const registerTokenizer = (tokenizer, overwrite = true) => {
    if (
      !tokenizer ||
      !tokenizer.id ||
      !tokenizer.fn ||
      !_.isFunction(tokenizer.fn)
    )
      throw new Error(
        `invalid tokenizer ${tokenizer &&
          tokenizer.id}: missing or invalid attribute id or fn`
      );
    if (overwrite === false && messageTokenizers[tokenizer.id.toString()]) {
      throw new Error(
        `tokenizer ${
          tokenizer.id
        } already registered & overwrite attribute false`
      );
    }
    messageTokenizers[tokenizer.id] = tokenizer.fn;
  };

  /**
   * Run tokenizers chain in sequence and return message tokens
   * @param message
   * @param tokenizers
   */
  const runTokenizers = (message, tokenizers) => {
    // TODO run tokenizers with Promise.resolve and chain them to get the result????? Pensar em como vai ser isso!!!!
  };

  /**
   * Build tokenizer chain for the topic
   * @param topic - Dialog topic
   * @return tokens - Identified tokens
   */
  const getTokenizers = topic => {
    // TODO: Check if flag useGlobaltokenizers is set to true and build tokenizers chain
    // return topic.tokenizers;
    // runTokenizers(message, topic.tokenizers);
  };

  const getTopic = topicId => {
    //TODO: Verificar necessidade, já que src.topics vai ser um objeto indexado pelo id
    return src.topics[topicId];
  };

  me.use = handler => {
    const { tokenizers = [] } = handler;
    tokenizers.forEach(registerTokenizer);
  };

  me.resolve = (message, ctx) => {
    // get topic from context
    const topic = getTopic(ctx.currTopicId); // TODO: Definir estrutura de objeto de contexto
    const topicTokenizers = getTokenizers(topic);
    const messageTokens = runTokenizers(message, topicTokenizers);
    return messageTokens.continuar;
  };

  init();
  return me;
};

module.exports = LinusDialog;
