import _ from 'lodash';
import EventEmitter from 'eventemitter3';
import requiredParam from './utils/requiredParam';
import RTInterpreter from './utils/RTInterpreter';
import extendError from './utils/extendError';

export class InvalidCondition extends extendError() {}
export class ScriptError extends extendError() {}
export class ConditionScriptError extends extendError(ScriptError) {}
export class MultipleInteractionsMatched extends extendError() {}
export class InvalidTopicIdError extends extendError() {}

export const INTERNAL_ATTR = 'env';
export const SAFE_ATTR = 'safe';
export default class LinusDialogBase extends EventEmitter {
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
    super();
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
   * Merge tokens into context, keeping internal attributes untouched.
   * Safe attributes are merged into existing safe attributes. If removing is needed
   * setContext should be used instead.
   * @param {Object} context - Context object to be enriched
   * @param {Object} tokens - Tokens to enrich context
   * @return {{[p: string]: *}} - Enriched context
   */
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
   * Set the current context as the passed tokens, keeping internal attributes untouched.
   * Safe attributes are replaced if explicitly set. It's expected for safe attributes to be an Object.
   * @param context
   * @param tokens
   * @return {{[p: String]: {}}}
   */
  setContext = (context, tokens) => {
    const internalAttrs = { ...context[INTERNAL_ATTR] };
    return {
      ...tokens,
      [SAFE_ATTR]: tokens[SAFE_ATTR]
        ? { ...tokens[SAFE_ATTR] }
        : context[SAFE_ATTR],
      [INTERNAL_ATTR]: internalAttrs,
    };
  };

  /**
   * Sets conversation topic by topicId
   * @param context
   * @param topicId
   * @return {*} context
   */
  setTopic = (context, topicId) => {
    this.getTopic(topicId); // throws if unknown topicId
    return {
      ...context,
      [INTERNAL_ATTR]: { ...context[INTERNAL_ATTR], topicId },
    };
  };

  /**
   * Get topic by id
   * @param {String} topicId - Topic Id
   * @return {Object<Topic>} - Topic
   */
  getTopic = topicId => {
    const topic = this.src.topics[topicId];
    if (!topic) throw new InvalidTopicIdError(`unknown topic id: "${topicId}"`);
    return topic;
  };

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
    let feedbacks = [];
    let nextContext = context;
    for (let i = 0, size = actions.length; i < size; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const actionReturn = await this.runAction(
        actions[i],
        nextContext,
        feedbacks
      );
      ({ feedbacks, context: nextContext } = actionReturn);
      // TODO: Call ActionDidRun event;
    }
    // TODO: call InteractionDidRun envent;
    return feedbacks;
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
    let nextFeedbacks = [...feedbacks];
    let nextContext = context;
    for (let i = 0, size = action.steps.length; i < size; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const stepFeedback = await this.resolveStepFeedback(
        action.steps[i].feedback,
        nextContext,
        nextFeedbacks[0]
      );
      const stepFeedbacks = _.castArray(stepFeedback);
      nextContext = this.handleFeedbacks(stepFeedbacks, context);
      nextFeedbacks = [...stepFeedbacks, ...nextFeedbacks];
      // TODO: Call stepDidRun event
    }
    return { feedbacks: nextFeedbacks, context: nextContext };
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

  /**
   * Handle feedback handlers that manipulate context somehow.
   * @param feedbacks
   * @param context
   */
  handleFeedbacks = (feedbacks = [], context) => {
    let nextContext = context;
    feedbacks.forEach(feedback => {
      const feedbackHandler =
        feedback.type && this.feedbackHandlers[feedback.type];
      const prevContext = _.cloneDeep(nextContext);
      if (feedbackHandler) {
        if (feedbackHandler.updateContext) {
          const feedbackChangedContext = feedbackHandler.updateContext(
            feedback,
            nextContext
          );
          nextContext = { ...feedbackChangedContext };
        }
        this.emitFeedbackHandlerEvents(
          feedbackHandler.events,
          feedback,
          prevContext,
          nextContext
        );
      }
    });
    return nextContext;
  };

  /**
   * Emit feedbackHandlers registered events
   * @param {[String]} events - Events to emit
   * @param feedback - Feedback that caused event
   * @param previousContext - Context before feedback
   * @param nextContext - Context after feedback
   */
  emitFeedbackHandlerEvents = (
    events = [],
    feedback,
    previousContext,
    nextContext
  ) => {
    events.forEach(evt => {
      this.emit(evt, feedback, previousContext, nextContext);
    });
  };

  /**
   * Handlers for each feedback type
   * @enum {Function}
   */
  feedbackHandlers = {
    SET_CONTEXT: {
      events: ['stepDidSetContext', 'contextDidUpdate'],
      updateContext: (feedback, context) =>
        this.setContext(context, feedback.payload),
    },
    MERGE_CONTEXT: {
      events: ['stepDidMergeContext', 'contextDidUpdate'],
      updateContext: (feedback, context) =>
        this.enrichContext(context, feedback.payload),
    },
    SET_TOPIC: {
      events: ['stepDidSetTopic', 'contextDidUpdate'],
      updateContext: (feedback, context) =>
        this.setTopic(context, feedback.payload),
    },
    REPLY: { events: ['stepDidReply'] },
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
