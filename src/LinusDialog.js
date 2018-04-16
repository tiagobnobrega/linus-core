// const log = require('debug')('linus:linusDialog');
const _ = require('lodash');

const requiredParam = require('./utils/requiredParam');

const CTX_ATTR = 'env';
const LinusDialog = initArgs => {
  const me = {};
  let src = {};
  const messageTokenizers = {};

  /**
   * Initializes LinusDialog instace with initArgs
   */
  const init = () => {
    // perform initialization based on initArgs;
    const {
      bot = requiredParam('bot'),
      topics = [],
      interactions = [],
    } = initArgs;

    src = {
      bot,
      topics: _.keyBy(topics, 'id'),
      interactions: _.keyBy(interactions, i => `${i.topicId}:${i.id}`),
    };
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
      !tokenizer.tokenize ||
      !_.isFunction(tokenizer.tokenize)
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
    messageTokenizers[tokenizer.id] = tokenizer.tokenize;
  };

  /**
   * Run tokenizers chain in sequence and return message tokens
   * @param message
   * @param tokenizers
   */
  const runTokenizers = async (message, tokenizers) => {
    const promises = tokenizers.map(tokenizer =>
      Promise.resolve(tokenizer.tokenize(message))
    );

    // each value must be an object or it should be ignored
    // should reduce to a single object merging properties
    //                                values.reduce((a, b) => _.merge(a, b), {}) ///pode funcionar assim também
    return Promise.all(promises).then(values => Object.assign(...values));
  };

  /**
   * Retrieve single tokenizer from id
   * @param tokenizerId
   * @return {*}
   */
  const getTokenizer = tokenizerId => {
    const tokenizer = messageTokenizers[tokenizerId];
    if (!tokenizer) throw new Error(`Tokenizer ${tokenizerId} not registered.`);
    return tokenizer;
  };

  /**
   * Get tokenizers from array of id
   * @param tokenizersIds
   * @return {*}
   */
  const getTokenizers = tokenizersIds => {
    if (!tokenizersIds) return [];
    return tokenizersIds.map(getTokenizer);
  };

  /**
   * Build tokenizer chain for the topic
   * @param topic - Dialog topic
   * @return tokens - Identified tokens
   */
  const getTopicTokenizers = topic => {
    const globalTokenizers = getTokenizers(src.bot.globalTokenizers);
    const beforeGlobalTokenizers = getTokenizers(
      topic.beforeGlobaltokenizers || []
    );
    const afterGlobalTokenizers = getTokenizers(
      topic.afterGlobaltokenizers || []
    );
    return [
      ...beforeGlobalTokenizers,
      ...globalTokenizers,
      ...afterGlobalTokenizers,
    ];
  };

  /**
   * Get topic by id
   * @param topicId
   * @return {*}
   */
  const getTopic = topicId =>
    // TODO: Verificar necessidade, já que src.topics vai ser um objeto indexado pelo id
    src.topics[topicId];

  me.use = handler => {
    const { tokenizers = [] } = handler;
    tokenizers.forEach(registerTokenizer);
  };

  me.resolve = async (message, ctx) => {
    // get topic from context
    const topic = getTopic(ctx[CTX_ATTR].topicId) || src.bot.rootTopic;
    const topicTokenizers = getTopicTokenizers(topic);
    const messageTokens = await runTokenizers(message, topicTokenizers);
    // TODO: @@@@@@@@@@@@@@@@@@@@ CONTINUAR @@@@@@@@@@@@@@@@@@@@@@@@@@
  };

  init();
  return me;
};

module.exports = LinusDialog;
