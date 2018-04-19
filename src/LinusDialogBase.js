import _ from 'lodash';
import requiredParam from './utils/requiredParam';

const CTX_ATTR = 'env';
export default class LinusDialogBase {
  // const me = this;
  src = {};
  messageTokenizers = {};

  constructor({
    bot = requiredParam('bot'),
    topics = [],
    interactions = [],
    handlers = [],
    tokenizers = [],
  }) {
    this.src = {
      bot,
      topics: _.keyBy(topics, 'id'),
      interactions: _.keyBy(interactions, i => `${i.topicId}:${i.id}`),
    };

    handlers.forEach(this.use);
    this.registerTokenizers(tokenizers);
  }

  /**
   * Register tokenizer on instance
   * @param {Object} tokenizer - Object as: {id: Tokenizer ID, fn: Tokenizer function (message:String)=>tokens:Object}
   * @param {Boolean} overwrite - Overwrite previous tokenizer registered with same id ?
   */
  registerTokenizer = (tokenizer, overwrite = true) => {
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
    if (
      overwrite === false &&
      this.messageTokenizers[tokenizer.id.toString()]
    ) {
      throw new Error(
        `tokenizer ${
          tokenizer.id
        } already registered & overwrite attribute false`
      );
    }
    this.messageTokenizers[tokenizer.id] = tokenizer.tokenize;
  };

  /**
   * Run tokenizers chain in sequence and return message tokens
   * @param {String} message - Message to be tokenized
   * @param {[Object]} tokenizers - Tokenizers objects
   */
  runTokenizers = async (message, tokenizers) => {
    const promises = tokenizers.map(
      tokenizer => Promise.resolve(tokenizer.tokenize(message)) // TODO: place catch to identify tokenizer error
    );

    // each value must be an object or it should be ignored
    // should reduce to a single object merging properties
    //                                values.reduce((a, b) => _.merge(a, b), {}) ///pode funcionar assim também
    return Promise.all(promises).then(values => Object.assign(...values));
  };

  /**
   * Retrieve single tokenizer from id
   * @param {String} tokenizerId - Tokenizer id
   * @return {Object} Tokenizer w/ id
   */
  getTokenizer = tokenizerId => {
    const tokenizer = this.messageTokenizers[tokenizerId];
    if (!tokenizer) throw new Error(`Tokenizer ${tokenizerId} not registered.`);
    return tokenizer;
  };

  /**
   * Get tokenizers from array of id
   * @param {[String]} tokenizersIds - Tokenizers Ids.
   * @return {*}
   */
  getTokenizers = tokenizersIds => {
    if (!tokenizersIds) return [];
    return tokenizersIds.map(this.getTokenizer);
  };

  /**
   * Build tokenizer chain for the topic
   * @param {Object<Topic>} topic - Dialog topic
   * @return {[Object<Tokens>]} tokens - Identified tokens
   */
  getTopicTokenizers = topic => {
    const globalTokenizers = this.getTokenizers(this.src.bot.globalTokenizers);
    const beforeGlobalTokenizers = this.getTokenizers(
      topic.beforeGlobaltokenizers || []
    );
    const afterGlobalTokenizers = this.getTokenizers(
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
   * @param {String} topicId - Topic Id
   * @return {Object<Topic>} - Topic
   */
  getTopic = topicId =>
    // TODO: Verificar necessidade, já que src.topics vai ser um objeto indexado pelo id
    this.src.topics[topicId];

  /**
   * Register tokenizers on dialog instance
   * @param {[Object<Tokenizers>]} tokenizers - Tokenizers to register
   */
  registerTokenizers = tokenizers => {
    tokenizers.forEach(this.registerTokenizer);
  };

  /**
   * Use passed handler.
   * @param {Object} handler - Handler to be used
   */
  use = handler => {
    const { tokenizers = [] } = handler;
    this.registerTokenizers(tokenizers);
  };

  resolve = async (message, ctx) => {
    // get topic from context
    const topic =
      this.getTopic(ctx[CTX_ATTR].topicId) || this.src.bot.rootTopic;
    const topicTokenizers = this.getTopicTokenizers(topic);
    const messageTokens = await this.runTokenizers(message, topicTokenizers);
    // TODO: @@@@@@@@@@@@@@@@@@@@ CONTINUAR @@@@@@@@@@@@@@@@@@@@@@@@@@
  };
}
