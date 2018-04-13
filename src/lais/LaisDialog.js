const _ = require('lodash');
const chalk = require('chalk');
const Context = require('./models/context');
const RuleFunctionCompiler = require('./RuleFunctionCompiler');

const LOG_LEVEL = {
  TRACE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 4,
  ERROR: 5,
};
let LaisDialog = function(initArgs) {
  let me = {};
  let rules = [];
  let dialogs = [];
  let REPEAT_OVERFLOW = 30;
  let logLevel = LOG_LEVEL.INFO;
  let PROTECTED_ATTRIBUTES = [
    '_dialog',
    'lastRules',
    'repeatCount',
    '__created',
    'userMessage',
    'lastMessageTime',
  ];

  function init() {
    if (!initArgs) {
      throw new Error('É necessário informar as regras e diálogos.');
    }

    rules = RuleFunctionCompiler.compile(initArgs.rules);
    dialogs = initArgs.dialogs;
    logLevel = (initArgs.logLevel && LOG_LEVEL[initArgs.logLevel]) || logLevel;
  }

  me.setDialogs = function(data) {
    dialogs = data;
  };

  me.setRules = function(data) {
    rules = RuleFunctionCompiler.compile(data);
  };

  const curryLog = lvl => (...args) => {
    if (logLevel <= lvl) console.log.apply(null, args);
  };

  let logger = {
    log: curryLog(LOG_LEVEL.INFO),

    trace: curryLog(LOG_LEVEL.TRACE),
    debug: curryLog(LOG_LEVEL.DEBUG),
    info: curryLog(LOG_LEVEL.INFO),
    warn: curryLog(LOG_LEVEL.WARN),
    error: curryLog(LOG_LEVEL.ERROR),
  };
  printObj = obj => {
    return JSON.stringify(obj, null, 1);
  };

  me.resolve = function(context, aiResponse, userMessage) {
    logger.debug(
      chalk.blue(
        '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>'
      )
    );
    logger.debug(chalk.blue('aiResponse: ' + printObj(aiResponse)));
    context = mergeContext(context, aiResponse, userMessage);
    logger.debug(chalk.cyan('context: ' + printObj(context)));
    const ret = resolveWithContext(context);
    logger.debug('return', ret);
    logger.debug(
      chalk.blue(
        '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<'
      )
    );
    return ret;
  };

  let resolveWithContext = function(context) {
    logger.trace('resolveWithContext::context= ' + printObj(context));
    let rule = getMatchingRule(context);
    context = updateRulesHistory(context, rule);
    logger.trace('resolveWithContext(2)::context= ' + printObj(context));
    return applyActions(rule, context);
  };

  let mergeContext = function(context, aiResponse, userMessage) {
    context = mergeIntents(context, aiResponse);
    context = mergeEntities(context, aiResponse);
    context = addLastMessageFromUser(context, userMessage);

    return context;
  };

  let mergeIntents = function(context, aiResponse) {
    let currentDialog = context._dialog;

    if (_.includes(currentDialog.listenTo, 'intents')) {
      let filteredIntents = aiResponse.intents.filter(function(intent) {
        return intent.confidence >= currentDialog.minConfidence;
      });
      let orderedIntents = _.orderBy(filteredIntents, ['confidence'], ['desc']);

      // As intenções anteriores são removidas antes de adicionar as novas
      // intenções retornadas pela IA.
      context.intents = [];

      orderedIntents.forEach(function(intent) {
        context.intents.push(intent.intent);
      });
    }

    return context;
  };

  let mergeEntities = function(context, aiResponse) {
    let currentDialog = context._dialog;

    if (_.includes(currentDialog.listenTo, 'entities')) {
      aiResponse.entities.forEach(function(entity) {
        logger.trace(chalk.green('mergeEntities::eval %s', printObj(entity)));
        if (!context.entities[entity.entity]) {
          context.entities[entity.entity] = [];
        }
        logger.trace(
          chalk.green(
            'mergeEntities::include ? %s',
            _.includes(context.entities[entity.entity], entity.value)
          )
        );
        if (!_.includes(context.entities[entity.entity], entity.value)) {
          context.entities[entity.entity].push(entity.value);
        }
      });
    }

    return context;
  };

  let addLastMessageFromUser = function(context, userMessage) {
    context.userMessage = userMessage;

    return context;
  };

  let reduceByPriority = function(a, b) {
    let pa = _.isNil(a.priority) ? 0 : a.priority,
      pb = _.isNil(b.priority) ? 0 : b.priority;
    if (pa === pb)
      throw new Error('Não é possível determinar uma única regra de dialogo');
    return pa > pb ? a : b;
  };

  let getMatchingRule = function(context) {
    let candidateRules = getCandidateRules(context);
    logger.trace(chalk.gray('candidates:' + candidateRules.map(r => r.id)));

    if (candidateRules.length === 0) {
      throw new Error(
        'No matching rule aplicable for context:' + printObj(context)
      );
    }

    let matchingRule = candidateRules.reduce(reduceByPriority);
    logger.trace(chalk.gray('matching rule=' + matchingRule.id));

    // Retorna apenas a regra com a maior prioridade.
    return matchingRule;
  };

  let getCandidateRules = function(context) {
    return rules.filter(function(rule) {
      return isRuleApplicabe(rule, context);
    });
  };

  let curryMatch = f => (f ? f : _.stubTrue);

  let isRuleApplicabe = function(rule, context) {
    let isTheSameDialog = rule.dialog === context._dialog.id;

    logger.trace(chalk.yellow('isRuleApplicabe::', printObj(rule)));
    if (isTheSameDialog) {
      logger.trace(
        chalk.yellow(rule.id + '>>' + curryMatch(rule.match)(context))
      );
    }

    return isTheSameDialog && curryMatch(rule.match)(context);
  };

  let updateRulesHistory = function(context, rule) {
    if (_.last(context.lastRules) === rule.id) {
      context.repeatCount++;
    } else {
      context.repeatCount = 0;
    }

    context.lastRules.push(rule.id);

    if (context.lastRules.length > 5) {
      context.lastRules.shift();
    }

    return context;
  };

  let applyActions = function(rule, context) {
    logger.trace('applyActions::context=' + printObj(context));
    let actions = getMatchingActions(rule, context);
    let replies = [];

    if (context.repeatCount >= REPEAT_OVERFLOW) {
      throw new Error('Maximum repeat overflow reached on rule: ' + rule.id);
    }

    actions.forEach(function(action) {
      try {
        context = applyAction(action, context);

        if (action.replies) {
          replies = replies.concat(action.replies);
        }

        if (action.evaluateNext === true) {
          logger.trace('applyActions(2)::context=' + printObj(context));
          let ret = resolveWithContext(context); //recursion
          context = ret.context;

          if (ret.replies) {
            replies = replies.concat(ret.replies);
          }
        }
      } catch (error) {
        logger.error('applyActions ERROR', error);
      }
    });

    logger.debug(
      chalk.grey('applyActions::retrun context=' + printObj(context))
    );
    return { context, replies };
  };

  let getMatchingActions = function(rule, context) {
    return rule.actions.filter(function(action) {
      return !action.match || action.match(context);
    });
  };

  let getProtectedAttributes = function(context) {
    return _.pick(context, PROTECTED_ATTRIBUTES);
  };

  let applyAction = function(action, context) {
    let protectedAttributes = getProtectedAttributes(context);
    context = setContext(action, _.cloneDeep(context));

    // Não estou usando o _.merge porque usando ele está gerando um bug
    // aonde o conteúdo do dialogs é modificado.
    for (property in protectedAttributes) {
      context[property] = protectedAttributes[property];
    }

    context = setDialog(action, context);

    return context;
  };

  let setContext = function(action, context) {
    if (action.setContext && _.isFunction(action.setContext)) {
      let newContextAsPlainObject = action.setContext(context.asPlainObject());
      _.merge(newContextAsPlainObject, { userId: context.userId });
      context = new Context(newContextAsPlainObject);
    }

    return context;
  };

  let setDialog = function(action, context) {
    logger.trace(chalk.magenta('setDialog::context=' + printObj(context)));
    let newDialogId = context._dialog.id;

    if (action.goToDialog) {
      if (_.isFunction(action.goToDialog)) {
        newDialogId = action.goToDialog(context.asPlainObject());
      } else {
        newDialogId = action.goToDialog;
      }
      let nextDialog = dialogs.find(function(dialog) {
        return dialog.id === newDialogId;
      });

      if (!nextDialog) {
        throw new Error("Couldn't find dialog with id:" + newDialogId);
      }

      logger.debug(chalk.magenta('setDialog::nextDialog=' + nextDialog.id));

      context._dialog = _.cloneDeep(nextDialog);
    }

    return context;
  };

  init();

  return me;
};

module.exports = LaisDialog;
