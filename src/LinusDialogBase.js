import _ from 'lodash';
import requiredParam from './utils/requiredParam';
import RTInterpreter from './utils/RTInterpreter';
import extendError from './utils/extendError';

export class InvalidCondition extends extendError() {}
export class ScriptError extends extendError() {}
export class ConditionScriptError extends extendError(ScriptError) {}
export class MultipleInteractionsMatched extends extendError() {}

const INTERNAL_ATTR = 'env';
export default class LinusDialogBase {
  src = {};
  messageTokenizers = {};

  constructor({
    bot = requiredParam('bot'),
    topics = [],
    interactions = [],
    handlers = [],
    tokenizers = [],
    sandboxScope = {},
  }) {
    this.interpreter = RTInterpreter(sandboxScope);
    // TODO: Should I care to not mutate passed interactions object ? (ie.:CloneDeep it, maybe immer)
    this.src = {
      bot,
      topics: _.keyBy(topics, 'id'),
      interactions: _.keyBy(
        this.interpretInteractionScritps(interactions),
        i => `${i.topicId}:${i.id}`
      ),
    };

    handlers.forEach(this.use);
    this.registerTokenizers(tokenizers);
  }

  /**
   * Interpret string conditions for function & calls interpretActions on interaction actions
   * @param interactions
   */
  interpretInteractionScritps = (interactions = []) => {
    // TODO: Should I care to not mutate passed interactions object ? (ie.:CloneDeep it, maybe immer)
    interactions.map(i => ({
      ...i,
      condition: i.condition && this.interpreter.require(i.condition),
      actions: this.interpretActions(i.actions),
    }));
  };

  /**
   * Interpret string conditions for function & calls interpretSteps on action steps
   * @param actions
   * @return {{condition: *|Object|{type, properties, additionalProperties}, steps: {feedback: *}[]}[]}
   */
  interpretActions = (actions = []) =>
    actions.map(a => ({
      ...a,
      condition: a.condition && this.interpreter.require(a.condition),
      steps: this.interpretSteps(a.steps),
    }));

  /**
   * Interpret string feddbacks for function
   * @param {Object<Step>} steps - steps to be transformed
   * @return {{feedback: *}[]}
   */
  interpretSteps = (steps = []) =>
    steps.map(s => ({
      ...s,
      feedback:
        s.feedback && _.isString(s.feedback)
          ? this.interpreter.require(s.feedback)
          : s.feedback,
    }));

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
   * Register tokenizers on dialog instance
   * @param {[Object<Tokenizers>]} tokenizers - Tokenizers to register
   */
  registerTokenizers = tokenizers => {
    tokenizers.forEach(this.registerTokenizer);
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
    const globalTokenizers =
      topic.useGlobalTokenizers === false
        ? []
        : this.getTokenizers(this.src.bot.globalTokenizers);
    const topicTokenizers = this.getTokenizers(topic.tokenizers || []);
    return [...globalTokenizers, ...topicTokenizers];
  };

  /**
   * Merge tokens into context, keeping internal attributes untouched
   * @param {Object} context - Context object to be enriched
   * @param {Object} tokens - Tokens to enrich context
   * @return {{[p: string]: *}} - Enriched context
   */
  enrichContext = (context, tokens) => {
    const internalAttrs = { ...context[INTERNAL_ATTR] };
    return { ...context, ...tokens, ...{ [INTERNAL_ATTR]: internalAttrs } };
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
   * Use passed handler.
   * @param {Object} handler - Handler to be used
   */
  use = handler => {
    const { tokenizers = [] } = handler;
    this.registerTokenizers(tokenizers);
  };

  /**
   * Get all interactions belonging to topic
   * @param topicId
   * @return {*}
   */
  getTopicInteractions = topicId => this.src.interactions[topicId];

  /**
   * Returns all interactions with condition function returns truthy
   * @param interactions
   * @param context
   * @return {*}
   */
  getInteractionCandidates = (interactions, context) =>
    interactions.filter(i => {
      const { condition, id = 'undefined interaction' } = i;
      if (!condition || condition === true) return true;
      if (!_.isFunction(condition))
        throw new InvalidCondition(
          `Interaction '${id}' condition is invalid. Expecting null, true or Function`
        );
      return condition(context);
    });

  /**
   * Given a set of interactions and context, returns the Interaction wich conditions are met and has the highest priority.
   * If 2 matched interactions have the same priority throws an error.
   * @param interactions
   * @param context
   * @return {*}
   */
  getTargetInteraction = (interactions, context) => {
    const interactionCandidates = this.getInteractionCandidates(
      interactions,
      context
    );
    return this.getHighOrderPriorityInteraction(interactionCandidates);
  };

  /**
   * Given a set of interactions, returns the interaction with highest priority. If 2 interactions have the same priority it throws an error.
   * @param interactions
   * @return {*}
   */
  getHighOrderPriorityInteraction = interactions => {
    if (interactions.length === 1) return interactions[0];
    const highestPriority = interactions.reduce(
      (a, b) => (a > b ? a : b),
      Number.MIN_SAFE_INTEGER
    );
    const highestInteractions = interactions.filter(i => i === highestPriority);
    if (highestInteractions.length > 1) {
      const interactionsIds = highestInteractions
        .map(i => i.id || 'undefined interaction')
        .join(', ');
      throw new MultipleInteractionsMatched(
        `Multiple interactions matched for context: ${interactionsIds}`
      );
    }
    return highestInteractions[0];
  };

  /**
   * Given a topic and context, returns the topic Interaction wich conditions are met and has the highest priority.
   * If 2 matched interactions have the same priority throws an error.
   * @param topic
   * @param context
   * @return {*}
   */
  getTopicTargetInteraction = (topic, context) => {
    const topicInteractions = this.getTopicInteractions(topic.id);
    return this.getTargetInteraction(topicInteractions, context);
  };

  resolve = async (message, ctx) => {
    // get topic from context
    const topic =
      this.getTopic(ctx[INTERNAL_ATTR].topicId) || this.src.bot.rootTopic;
    const topicTokenizers = this.getTopicTokenizers(topic);
    const messageTokens = await this.runTokenizers(message, topicTokenizers);
    const enrichedContext = this.enrichContext(ctx, messageTokens);
    const targetItnteraction = this.getTopicTargetInteraction(
      topic,
      enrichedContext
    );

    // TODO: @@@@@@@@@@@@@@@@@@@@ CONTINUAR @@@@@@@@@@@@@@@@@@@@@@@@@@
  };
}
