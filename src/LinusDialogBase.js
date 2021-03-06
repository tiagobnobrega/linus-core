/* eslint-disable no-await-in-loop */
import _ from 'lodash';
import EventEmitter from 'eventemitter3';
import debugLib from 'debug';
import requiredParam from './utils/requiredParam';
import RTInterpreter from './utils/RTInterpreter';
import extendError from './utils/extendError';

const trace = debugLib('linus:LinusDialog:trace');
// const debug = debugLib('linus:LinusDialog:debug');
// const info = debugLib('linus:LinusDialog:info');
// const warn = debugLib('linus:LinusDialog:warn');
// const error = debugLib('linus:LinusDialog:error');

export class RuntimeError extends extendError() {}
export class InvalidCondition extends extendError(RuntimeError) {}
export class ScriptError extends extendError() {}
export class ConditionScriptError extends extendError(ScriptError) {}
export class MultipleInteractionsMatched extends extendError() {}
export class InvalidTopicIdError extends extendError() {}
export class InvalidTokenizerError extends extendError() {}

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
   * @param {Object} steps - steps to be transformed
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
      throw new InvalidTokenizerError(
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
    this.messageTokenizers[tokenizer.id] = tokenizer; // TODO: @@@@@@!!@!@!@!@!@@@@ AQUI DEVE REGISTRAR O OBJETO TOKENIZER INTEIRO, NÃO SÓ A FUNCAO TOKENIZE @@@@!@!@!@@@!@@!@!@!@@!@
  };

  /**
   * Register tokenizers on dialog instance
   * @param {[Object]} tokenizers - Tokenizers to register
   */
  registerTokenizers = tokenizers => {
    tokenizers.forEach(this.registerTokenizer);
  };

  /**
   * Register eventHandlers. The recieved object should have event names as attributes with handler function as their values.
   * @param {Object} eventHandlers - Object in format {'EVT_NAME': EVT_FUNC(){}}
   */
  registerEventHandlers = eventHandlers => {
    Object.entries(eventHandlers).forEach(([name, fn]) => {
      if (_.isFunction(fn)) {
        this.on(name, fn);
      } else {
        // TODO: should emit warning event maybe? Use debug lib instead?
        console.warn(`event ${name} value is not a function`);
      }
    });
  };

  /**
   * Run tokenizers chain in sequence and return message tokens
   * @param {String} message - Message to be tokenized
   * @param {[Object]} tokenizers - Tokenizers objects
   */
  runTokenizers = async (message, tokenizers) => {
    const promises = tokenizers.map(tokenizer => {
      try {
        return Promise.resolve(tokenizer.tokenize(message)); // TODO: place catch to identify tokenizer error
      } catch (err) {
        throw new InvalidTokenizerError(
          `error running tokenizer ${tokenizer.id}`,
          err
        ); // TODO: Preciso saber qual tokeniser deu pau, o id do tokenizer tem que chegar aqui!!!!@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
      }
    });

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
   * @param {Object} topic - Dialog topic
   * @return {[Object]} tokens - Identified tokens
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
   * @return {Object} - Enriched context
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
   * @return {Object}
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
      [SAFE_ATTR]: context[SAFE_ATTR],
      [INTERNAL_ATTR]: { ...context[INTERNAL_ATTR], topicId },
    };
  };

  /**
   * Get topic by id
   * @param {String} topicId - Topic Id
   * @return {Object} - Topic
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
    const { tokenizers = [], events = {} } = handler;
    this.registerTokenizers(tokenizers);
    this.registerEventHandlers(events);
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
          `Error evaluating candidate '${e.topicId}.${
            e.id
          }' condition function`,
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
    trace(
      'getTargetInteraction: found candidates:\n %O',
      interactionCandidates.map(i => i.id)
    );
    return this.getHighOrderPriorityInteraction(interactionCandidates);
  };

  /**
   * Given a set of interactions, returns the interaction with highest priority. If 2 interactions have the same priority it throws an error.
   * @param interactions
   * @return {*}
   */
  getHighOrderPriorityInteraction = interactions => {
    if (interactions.length === 1) {
      trace(`Single candidate elected:${interactions[0].id}`);
      return interactions[0];
    }

    const highestPriority = interactions.reduce((a, b) => {
      const bPriority = b.priority || 0;
      return a > bPriority ? a : bPriority;
    }, Number.MIN_SAFE_INTEGER);
    trace(
      `getHighOrderPriorityInteraction: highestPriority found: ${highestPriority}`
    );
    const highestInteractions = interactions.filter(
      i => (i.priority || 0) === highestPriority
    );

    trace(
      `getHighOrderPriorityInteraction: highestInteractions:\n %O`,
      highestInteractions.map(i => i.id)
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
    if (!topic || !topic.id)
      throw new InvalidTopicIdError(
        `Invalid topic id from topic: "${JSON.stringify(topic)}"`
      );
    const topicInteractions = this.getTopicInteractions(topic.id);
    trace(
      `getTopicTargetInteraction: found topic Interactions:\n %O`,
      topicInteractions.map(i => i.id)
    );
    return this.getTargetInteraction(topicInteractions, context);
  };

  /**
   * Execute interactions matched actions and returns a Promise which will resolve to a array of feedbacks
   * @param interaction
   * @param context
   * @return {Promise<{feedbacks:Array, context:*}>}
   */
  runInteraction = async (
    interaction = requiredParam('interaction'),
    context = requiredParam('context')
  ) => {
    const actions = this.getCandidates(interaction.actions, context);
    trace('runInteraction: found action candidates:%O', actions);
    let feedbacks = [];
    let nextContext = context;
    for (let i = 0, size = actions.length; i < size; i += 1) {
      trace(`runInteraction: loop action:${i}`);
      // eslint-disable-next-line no-await-in-loop
      const actionReturn = await this.runAction(
        actions[i],
        nextContext,
        feedbacks
      );
      trace(`runInteraction:\t loop action:%o`, actionReturn);
      ({ feedbacks, context: nextContext } = actionReturn);
    }
    const ret = { feedbacks, context: nextContext };
    this.emit('interactionDidRun', ret);
    return ret;
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
    let shouldRunNext = true;
    trace(`runAction: action:%o`, action);
    for (let i = 0, size = action.steps.length; i < size; i += 1) {
      trace(`runAction: loop step:${i}`);
      // eslint-disable-next-line no-await-in-loop
      const stepFeedbackReturn = await this.resolveStepFeedback(
        action.steps[i].feedback,
        nextContext,
        nextFeedbacks[0]
      );
      let stepFeedbacks = _.castArray(stepFeedbackReturn);
      trace(`runAction: \tstepFeedbacks:%o`, stepFeedbacks);
      ({
        context: nextContext,
        feedbacks: stepFeedbacks,
        shouldRunNext,
        // eslint-disable-next-line no-await-in-loop
      } = await this.handleFeedbacks(stepFeedbacks, context));
      trace(`runAction: \thandleFeedbacks return:%o`, {
        context: nextContext,
        feedbacks: stepFeedbacks,
        shouldRunNext,
      });
      nextFeedbacks = [...stepFeedbacks, ...nextFeedbacks];
      this.emit('stepDidRun', {
        feedbacks: nextFeedbacks,
        context: nextContext,
      });
      if (!shouldRunNext) break;
    }
    const ret = { feedbacks: nextFeedbacks, context: nextContext };
    this.emit('actiondidRun', ret);
    return ret;
  };

  /**
   * Returns a Promise wich will resolve to stepFeedback or stepFeedback return value (if it's a function)
   * or stepFeedback resolved value (if it's a Promise).
   * @param stepFeedback
   * @param context
   * @param feedback
   * @return {Promise<any>}
   */
  resolveStepFeedback = (
    stepFeedback,
    context = requiredParam('context'),
    feedback
  ) => {
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
  handleFeedbacks = async (
    feedbacks = [],
    context = requiredParam('context')
  ) => {
    let retContext = context;
    let retFeedbacks = [];
    // const stepFeedbacks = feedbacks;
    let shouldRunNext = true;
    for (let i = 0, size = feedbacks.length; i < size; i += 1) {
      const feedback = feedbacks[i];
      // trace(`handleFeedbacks: loop feedback:${i}`);
      let handlerFeedbacks = [];
      const prevContext = _.cloneDeep(retContext);
      // emit stepWillRun event
      this.emit('stepWillRun', feedback, prevContext);
      const feedbackHandlerReturn = await this.runFeedbackHandler(
        feedback,
        prevContext,
        retContext
      );
      ({
        context: retContext,
        feedbacks: handlerFeedbacks,
        shouldRunNext,
      } = feedbackHandlerReturn);
      trace(
        `handleFeedbacks: \trunFeedbackHandler return:%o`,
        feedbackHandlerReturn
      );
      retFeedbacks = [...handlerFeedbacks, feedback, ...retFeedbacks];
      if (!shouldRunNext) break;
    }

    return {
      context: retContext,
      feedbacks: retFeedbacks,
      shouldRunNext,
    };
  };

  runFeedbackHandler = async (
    feedback,
    prevContext = requiredParam('prevContext'),
    context = requiredParam('context')
  ) => {
    let shouldRunNext = true;
    let retContext = context;
    let retFeedbacks = [];
    const feedbackHandler =
      feedback.type && this.feedbackHandlers[feedback.type];
    if (feedbackHandler) {
      trace(
        `runFeedbackHandler: running feedbackHandler ${feedback.type} :%o`,
        feedbackHandler
      );
      retContext = this.feedbackHandlerUpdateContext(
        feedbackHandler,
        feedback,
        context
      );
      trace(`runFeedbackHandler: returned Context:%o`, retContext);
      this.emitFeedbackHandlerEvents(
        feedbackHandler.events,
        feedback,
        prevContext,
        retContext
      );
    }
    trace(`runFeedbackHandler: resolving meta attribute`);
    const handleMetaReturn = await this.feedbackHandleMeta(
      feedback,
      retContext
    );
    ({
      context: retContext,
      feedbacks: retFeedbacks,
      shouldRunNext,
    } = handleMetaReturn);

    trace(`runFeedbackHandler: feedbackHandleMeta return:%o`, {
      context: retContext,
      feedbacks: retFeedbacks,
      shouldRunNext,
    });
    return { context: retContext, feedbacks: retFeedbacks, shouldRunNext };
  };

  feedbackHandlerUpdateContext = (
    feedbackHandler = requiredParam('feedbackHandler'),
    feedback = requiredParam('feedback'),
    context = requiredParam('context')
  ) => {
    let retContext = context;
    if (feedbackHandler.updateContext) {
      const feedbackChangedContext = feedbackHandler.updateContext(
        feedback,
        context
      );
      retContext = { ...feedbackChangedContext };
    }
    return retContext;
  };

  feedbackHandleMeta = async (
    feedback = requiredParam('feedback'),
    context = requiredParam('context')
  ) => {
    trace(
      'feedbackHandleMeta: handle feedback meta attr, feedback:%o',
      feedback
    );
    let shouldRunNext = true;
    let retFeedbacks = [];
    let retContext = context;
    const feedbackFlowActions =
      feedback && feedback.meta && feedback.meta.flowActions;

    if (feedbackFlowActions) {
      trace('feedbackHandleMeta: feedbackFlowActions:%o', feedbackFlowActions);
      if (feedbackFlowActions.indexOf('BREAK') !== -1) shouldRunNext = false;
      // recursivelly call resolveContext if RESOLVE_AGAIN is set in flowActions;
      if (feedbackFlowActions.indexOf('RESOLVE_AGAIN') !== -1) {
        trace('!!!!!! feedbackHandleMeta: recursion call: calling resolve ');
        const resolveReturn = await this.resolveContext(context);
        ({ context: retContext, feedbacks: retFeedbacks } = resolveReturn);
        trace('!!!!!! feedbackHandleMeta: recursion call for resolve return:', {
          context: retContext,
          feedbacks: retFeedbacks,
        });
      }
    } else {
      trace('feedbackHandleMeta: feedbackFlowActions is falsy');
    }
    return { context: retContext, feedbacks: retFeedbacks, shouldRunNext };
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
    // get topic from context if not present set default topic
    let context = ctx;
    const topicId = context[INTERNAL_ATTR] && context[INTERNAL_ATTR].topicId;
    if (!topicId) {
      context = this.setTopic(context, this.src.bot.rootTopic);
    }
    const topic = this.getTopic(
      context[INTERNAL_ATTR] && context[INTERNAL_ATTR].topicId
    );
    const topicTokenizers = this.getTopicTokenizers(topic);
    const messageTokens = await this.runTokenizers(message, topicTokenizers);
    const enrichedContext = this.enrichContext(context, messageTokens);
    return this.resolveContext(enrichedContext);
  };

  resolveContext = async context => {
    const topic = this.getTopic(
      context[INTERNAL_ATTR] && context[INTERNAL_ATTR].topicId
    );
    const targetInteraction = this.getTopicTargetInteraction(topic, context);
    if (!targetInteraction) {
      throw new InvalidCondition(
        `No interaction found for: \nTopic:\n${JSON.stringify(
          topic
        )}\nContext:\n${JSON.stringify(context)}`
      );
    }
    trace('resolveContext: targetInteraction:%o', targetInteraction);
    const {
      feedbacks: interactionFeedbacks,
      context: nextContext,
    } = await this.runInteraction(targetInteraction, context);
    trace('resolveContext: runInteraction result: %O', {
      interactionFeedbacks,
      nextContext,
    });
    return { feedbacks: interactionFeedbacks, context: nextContext };
  };
}
