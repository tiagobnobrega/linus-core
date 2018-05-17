import _ from 'lodash';
import requiredParam from './utils/requiredParam';
import RTInterpreter from './utils/RTInterpreter';
import extendError from './utils/extendError';

export class InvalidCondition extends extendError() {}
export class ScriptError extends extendError() {}
export class ConditionScriptError extends extendError(ScriptError) {}
export class MultipleInteractionsMatched extends extendError() {}

export const INTERNAL_ATTR = 'env';
export const SAFE_ATTR = 'safe';
export default class LinusDialogBase {
  src = {};
  messageTokenizers = {};

  constructor(
    {
      bot = requiredParam('bot'),
      topics = [],
      interactions = [],
      handlers = [],
      tokenizers = [],
      sandboxScope = {},
    } = { bot: { rootTopic: 'ROOT' } }
  ) {
    this.interpreter = RTInterpreter(sandboxScope);
    // TODO: Should I care to not mutate passed interactions object ? (ie.:CloneDeep it, maybe immer)
    this.src = {
      bot,
      topics: _.keyBy(topics, 'id'),
      interactions: this.groupInteractionsByTopicId(
        this.interpretInteractionScritps(interactions)
      ),
    };

    handlers.forEach(this.use);
    this.registerTokenizers(tokenizers);
  }

  /**
   * Group interactions by topic id
   * @param interactions
   * @return {Object} - Grouped interactions by topicId
   */
  groupInteractionsByTopicId = interactions =>
    interactions.reduce((a, b) => {
      const ret = a;
      ret[b.topicId] = ret[b.topicId] || [];
      ret[b.topicId] = [...ret[b.topicId], b];
      return ret;
    }, {});

  /**
   * Interpret string conditions for function & calls interpretActions on interaction actions
   * @param interactions
   */
  interpretInteractionScritps = (interactions = []) =>
    // TODO: Should I care to not mutate passed interactions object ? (ie.:CloneDeep it, maybe immer)
    interactions.map(i => ({
      ...i,
      condition: i.condition && this.interpreter.require(i.condition),
      actions: this.interpretActions(i.actions),
    }));

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
  // TODO: Para o setContext tem que fazer uma lógica melhor dos campos safe
  //       Safe attributes should be preserved if NOT explicity redefined
  //       Safe attributes should be replaced if explicity redefined
  enrichContext = (context, tokens) => {
    const internalAttrs = { ...context[INTERNAL_ATTR] };
    return {
      ...context,
      ...tokens,
      [SAFE_ATTR]: { ...context[SAFE_ATTR], ...tokens[SAFE_ATTR] },
      [INTERNAL_ATTR]: internalAttrs,
    };
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
   * Returns all elements(any w/ condition) with condition function returns truthy
   * @param elements
   * @param context
   * @return {*}
   */
  getCandidates = (elements = [], context = requiredParam('context')) =>
    elements.filter((e, ind) => {
      const { condition, id = 'undefined interaction' } = e;
      if (condition == null || condition === true) return true;
      if (condition === false) return false;
      if (!_.isFunction(condition))
        throw new InvalidCondition(
          `Candidate [${ind}] '${id}' condition is invalid. Expecting null, truthy, falsy or Function`
        );
      try {
        return condition(context);
      } catch (err) {
        const csErr = new ConditionScriptError(
          'Error evaluating candidate condition function',
          err
        );
        // csErr.stack =
        throw csErr;
      }
    });

  /**
   * Given a set of interactions and context, returns the Interaction wich conditions are met and has the highest priority.
   * If 2 matched interactions have the same priority throws an error.
   * @param interactions
   * @param context
   * @return {*}
   */
  getTargetInteraction = (interactions, context) => {
    const interactionCandidates = this.getCandidates(interactions, context);
    return this.getHighOrderPriorityInteraction(interactionCandidates);
  };

  /**
   * Given a set of interactions, returns the interaction with highest priority. If 2 interactions have the same priority it throws an error.
   * @param interactions
   * @return {*}
   */
  getHighOrderPriorityInteraction = interactions => {
    if (interactions.length === 1) return interactions[0];

    const highestPriority = interactions.reduce((a, b) => {
      const bPriority = b.priority || 0;
      return a > bPriority ? a : bPriority;
    }, Number.MIN_SAFE_INTEGER);

    const highestInteractions = interactions.filter(
      i => i.priority === highestPriority
    );

    if (highestInteractions.length > 1) {
      const interactionsIds = highestInteractions
        .map(i => i.id || 'undefined interaction')
        .join(', ');
      throw new MultipleInteractionsMatched(
        `Multiple interactions matched w/ same priority (${highestPriority}): ${interactionsIds}`
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

  /**
   * Execute interactions matched actions and returns a Promise which will resolve to a array of feedbacks
   * @param interaction
   * @param context
   * @return {Promise<void>}
   */
  runInteraction = async (interaction, context) => {
    const actions = this.getCandidates(interaction.actions, context);
    const feedbacks = [];
    for (let i = 0, size = actions.length; i < size; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      // console.log({action:actions[i],context, feedbacks});
      const actionFeedbacks = await this.runAction(
        actions[i],
        context,
        feedbacks
      );
      console.log('actionFeedbacks:',actionFeedbacks);
      feedbacks.unshift(...actionFeedbacks);
      // TODO: Call ActionDidRun event;
    }
    // TODO: call InteractionDidRun envent;
  };

  /**
   * Execute all steps of some action and returns a Promise which will resolve to a array of feedbacks.
   * @param action
   * @param context
   * @param feedbacks
   * @return {Promise<*[]>}
   */
  runAction = async (
    action,
    context = requiredParam('context'),
    feedbacks = []
  ) => {
    const nextFeedbacks = [...feedbacks];
    // console.log('steps.length:'+action.steps.length);
    for (let i = 0, size = action.steps.length; i < size; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const feedback = await this.resolveStepFeedback(
        action.steps[i].feedback,
        context,
        nextFeedbacks[0]
      );
      console.log('runAction feedback:',feedback);
      nextFeedbacks.unshift(feedback);
      // TODO: Call stepDidRun event
      // TODO: Should apply feedback if it's a context change of some sort
    }
    return nextFeedbacks;
  };

  /**
   * Returns a Promise wich will resolve to stepFeedback or stepFeedback return value (if it's a function)
   * or stepFeedback resolved value (if it's a Promise).
   * @param stepFeedback
   * @param context
   * @param feedback
   * @return {Promise<any>}
   */
  resolveStepFeedback = (stepFeedback, context, feedback) => {
    // TODO Should all feedbacks be passed as a third parameter?
    if (_.isFunction(stepFeedback)) {
      return Promise.resolve(stepFeedback(context, feedback));
    }
    return Promise.resolve(stepFeedback);
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
    const interactionFeedbacks = this.runInteraction(
      targetItnteraction,
      enrichedContext
    );
    return { feedbacks: interactionFeedbacks, context: enrichedContext };
  };
}
