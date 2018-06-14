import debug from 'debug';
import LinusDialogBase, {
  ConditionScriptError,
  InvalidCondition,
  MultipleInteractionsMatched,
  INTERNAL_ATTR as LINUS_INTERNAL_ATTR,
  SAFE_ATTR as LINUS_SAFE_ATTR,
  InvalidTopicIdError,
} from './LinusDialogBase';
import botTestData from './utils/test/test-bot-data';

import { validTokenizer, testTokenizer } from './utils/test/tokenizers';
import { wait } from './utils/test/helpers';

// globals:
let linus = new LinusDialogBase(botTestData);

// Before each test set new fresh instance
beforeEach(() => {
  linus = new LinusDialogBase(botTestData);
});

// Register mocked tokenizer from ids
const registerTestTokenizers = (...tokenizersIds) => {
  tokenizersIds.forEach(id => linus.registerTokenizer(testTokenizer(id)));
};

describe('LinusDialogBase', () => {
  describe('LinusDialogBase: Initialization', () => {
    test('Should be able to initialize w/o arguments', () => {
      const callFn = () => {
        linus = new LinusDialogBase();
      };
      expect(callFn).not.toThrow();
    });

    test('Should store bot argument in src', () => {
      const { bot } = linus.src;
      expect(bot).toMatchObject(botTestData.bot);
    });

    test('Should store topics argument as object in src', () => {
      const { topics } = linus.src;
      expect(topics).not.toEqual(expect.any(Array));
      expect(Object.keys(topics).length).toBe(botTestData.topics.length);
    });

    test('Should store interactions argument as object in src', () => {
      const { interactions } = linus.src;
      let topicIds = botTestData.interactions.map(({ topicId }) => topicId);
      topicIds = [...new Set(topicIds)];
      expect(interactions).not.toEqual(expect.any(Array));
      expect(Object.keys(interactions)).toEqual(
        expect.arrayContaining(topicIds)
      );
    });

    test('groupInteractionsByTopicId should return object w/ grouped interactions by topic id', () => {
      const grouped = linus.groupInteractionsByTopicId(
        botTestData.interactions
      );
      let topicIds = botTestData.interactions.map(({ topicId }) => topicId);
      topicIds = [...new Set(topicIds)];
      expect(grouped).not.toEqual(expect.any(Array));
      expect(Object.keys(grouped)).toEqual(expect.arrayContaining(topicIds));
    });
  });

  describe('LinusDialogBase: Script interpretation', () => {
    const stepFunctionFeedback = { feedback: `()=>{true}` };
    const stepObjectFeedback = {
      feedback: {
        type: 'REPLY',
        data: { type: 'text', content: 'Feedback Reply Text' },
      },
    };

    test('Steps feedback should be interpreted if is string', () => {
      const steps = linus.interpretSteps([{ ...stepFunctionFeedback }]);
      expect(steps[0].feedback).toEqual(expect.any(Function));
    });

    test('Steps feedback should be untouched if not String', () => {
      const steps = linus.interpretSteps([{ ...stepObjectFeedback }]);
      expect(steps[0]).toMatchObject(stepObjectFeedback);
    });

    test('All steps feedback should be interpreted and keep order', () => {
      const steps = linus.interpretSteps([
        { ...stepFunctionFeedback },
        { ...stepObjectFeedback },
      ]);
      expect(steps[0].feedback).toEqual(expect.any(Function));
      expect(steps[1]).toMatchObject(stepObjectFeedback);
    });

    test('Invalid feedback string should throw, when interpreted', () => {
      const invalidStep = { feedback: `()->'syntaxError'` };
      expect(() => linus.interpretSteps([invalidStep])).toThrow();
    });

    test('All steps feedback should be interpreted and keep order', () => {
      const steps = linus.interpretSteps([
        { ...stepFunctionFeedback },
        { ...stepObjectFeedback },
      ]);
      expect(steps[0].feedback).toEqual(expect.any(Function));
      expect(steps[1]).toMatchObject(stepObjectFeedback);
    });

    test('interpretInteractionScritps should return same amount of interactions', () => {
      const { interactions } = botTestData;
      const interpreted = linus.interpretInteractionScritps(interactions);
      expect(interpreted).toEqual(expect.any(Array));
      expect(interpreted.length).toBe(interactions.length);
    });
  });

  describe('LinusDialogBase: Tokenizer Operations', () => {
    // register tokenizers
    test('Tokenizer w/o id should throw Error', () => {
      const cloneTokenizer = validTokenizer();
      cloneTokenizer.id = null;
      expect(() => linus.registerTokenizer(cloneTokenizer)).toThrow();
    });

    test('Tokenizer w/o tokenize function should throw Error', () => {
      const cloneTokenizer = validTokenizer();
      cloneTokenizer.tokenize = null;
      expect(() => linus.registerTokenizer(cloneTokenizer)).toThrow();
    });

    test('Tokenizer w tokenize function NOT a function should throw Error', () => {
      const cloneTokenizer = validTokenizer();
      cloneTokenizer.tokenize = 'NOT A FUNCTION';
      expect(() => linus.registerTokenizer(cloneTokenizer)).toThrow();
    });

    test('Register 2 tokenizers w/ same id should throw if NOT overriding', () => {
      const tokenizer1 = validTokenizer('SameId');
      const tokenizer2 = validTokenizer('SameId');
      expect(() => {
        linus.registerTokenizer(tokenizer1);
        linus.registerTokenizer(tokenizer2, false);
      }).toThrow();
    });

    test('Register 2 tokenizers w/ same id should NOT throw if overriding', () => {
      const tokenizer1 = validTokenizer('SameId');
      const tokenizer2 = validTokenizer('SameId');
      expect(() => {
        linus.registerTokenizer(tokenizer1);
        linus.registerTokenizer(tokenizer2, true);
      });
    });

    test('Registered tokenizer should be accessible by id', () => {
      linus.registerTokenizer(validTokenizer('tokenizerId'));
      const foundTokenizer = linus.getTokenizer('tokenizerId');
      expect(foundTokenizer).toBeDefined();
    });

    test('getTokenizers should return empty array when called w/o id', () => {
      linus.registerTokenizer(validTokenizer('tokenizerId'));
      const foundTokenizer = linus.getTokenizers();
      expect(foundTokenizer.length).toBe(0);
    });

    test('Registered tokenizers w/ array should be accessible by id', () => {
      linus.registerTokenizers([
        validTokenizer('tokenizer1'),
        validTokenizer('tokenizer2'),
      ]);
      let foundTokenizer = linus.getTokenizer('tokenizer1');
      expect(foundTokenizer).toBeDefined();
      foundTokenizer = linus.getTokenizer('tokenizer2');
      expect(foundTokenizer).toBeDefined();
    });

    test('NOT Registered tokenizers should throw when accessed by id', () => {
      linus.registerTokenizer(validTokenizer('tokenizer1'));
      expect(() => {
        linus.getTokenizer('NOT_REGISTERED');
      }).toThrow();
    });

    test('Passed tokenizers to runTokenizers should output expected objects', async () => {
      const tokenizers = [
        testTokenizer('tokenizer1'),
        testTokenizer('tokenizer2'),
      ];
      const messageTokenizers = await linus.runTokenizers(
        'test output',
        tokenizers
      );
      expect(messageTokenizers.tokenizer1).toBe('test output');
      expect(messageTokenizers.tokenizer2).toBe('test output');
    });

    test('Passed tokenizers should be runned async by runTokenizers (in less than 200ms)', async () => {
      const tokenizers = [
        testTokenizer('tokenizer1', 250),
        testTokenizer('tokenizer2', 250),
      ];
      const messageTokenizers = await linus.runTokenizers(
        'test output',
        tokenizers
      );
      let timediff =
        messageTokenizers.tokenizer1_timestamp -
        messageTokenizers.tokenizer2_timestamp;
      timediff = timediff > 0 ? timediff : timediff * -1;

      expect(timediff).toBeLessThan(200);
    });
  });

  describe('LinusDialogBase: Topic Operations', () => {
    test('getTopic should return topic', () => {
      const topicId = 'ROOT';
      const topic = linus.getTopic(topicId);
      expect(topic.id).toBe(topicId);
    });

    test('getTopic should throw if topicId is NOT a known topic id', () => {
      const topicId = 'INVALID_TOPIC_ID';
      const callFn = () => linus.getTopic(topicId);
      expect(callFn).toThrow();
    });

    test('getTopicTokenizers should return global tokenizers if useGlobalTokenizers is NOT false', () => {
      registerTestTokenizers('globalTokenizer', 'rootGlobalTokenizer');
      const topicId = 'ROOT';
      const topic = linus.getTopic(topicId);
      const topicTokenizers = linus.getTopicTokenizers(topic);
      expect(topicTokenizers.length).toBe(2);
    });
    test('getTopicTokenizers should NOT return global tokenizers if useGlobalTokenizers is false', () => {
      registerTestTokenizers('globalTokenizer', 'rootGlobalTokenizer');
      const topicId = 'LOCAL_TOKENIZER';
      const topic = linus.getTopic(topicId);
      const topicTokenizers = linus.getTopicTokenizers(topic);
      expect(topicTokenizers.length).toBe(1);
    });
  });

  describe('LinusDialogBase: Interaction Retrival', () => {
    test('getTopicInteractions should return all passed topic id interactions and no other topic interactions', () => {
      const interactions = linus.getTopicInteractions('MOVIE_SUGGESTION');
      expect(interactions.length).toBe(2);
      const interactionIds = interactions.map(i => i.id);
      expect(interactionIds).toEqual(
        expect.arrayContaining(['complete_data', 'incomplete_data'])
      );
    });

    test('getCandidates should pass context object to condition function', () => {
      const makeInteraction = (id, condition) => ({
        id,
        condition,
      });
      const candidates = linus.getCandidates(
        [
          makeInteraction('c1', c => !!c.contextVar),
          makeInteraction('c2', () => true),
        ],
        { contextVar: true }
      );
      expect(candidates.map(({ id }) => id)).toEqual(
        expect.arrayContaining(['c1', 'c2'])
      );
    });

    test('getCandidates should return all and only interaction wich condition or is null or evaluates to truthy', () => {
      const makeInteraction = (id, condition) => ({
        id,
        condition,
      });
      const candidates = linus.getCandidates(
        [
          makeInteraction('t1', () => true),
          makeInteraction('t2', () => 'true'),
          makeInteraction('t3', c => c.shouldi3),
          makeInteraction('t4'),
          makeInteraction('t5', null),
          makeInteraction('f1', () => false),
          makeInteraction('f2', c => c.shouldi5),
          makeInteraction('f3', false),
        ],
        { shouldi3: true }
      );
      expect(candidates).toEqual(expect.any(Array));
      expect(candidates.map(({ id }) => id)).toEqual(
        expect.arrayContaining(['t1', 't2', 't3', 't4', 't5'])
      );
      expect(candidates.map(({ id }) => id)).not.toEqual(
        expect.arrayContaining(['f1', 'f2'])
      );
    });

    test('getCandidates should throw ConditionScriptError if condition function has error', () => {
      const callFn = candidate => () => linus.getCandidates([candidate], {});
      const candidate = {
        condition: () => console.invalidMethod(),
      };
      expect(callFn(candidate)).toThrow(ConditionScriptError);
    });

    test('getCandidates should throw if any interaction condition is not null, truthy, falsy or Function', () => {
      const callFn = candidate => () => linus.getCandidates([candidate], {});
      expect(callFn({ condition: 55 })).toThrow(InvalidCondition);
      expect(callFn({ condition: {} })).toThrow(InvalidCondition);
      expect(callFn({ condition: [] })).toThrow(InvalidCondition);
      expect(callFn({ condition: () => 55 })).not.toThrow();
      expect(callFn({ condition: false })).not.toThrow();
      expect(callFn({ condition: true })).not.toThrow();
      expect(callFn({ condition: null })).not.toThrow();
    });

    test('getHighOrderPriorityInteraction should return the interaction with highest priority', () => {
      const makeCandidate = (id, priority) => ({
        id,
        priority,
      });

      const hopi = linus.getHighOrderPriorityInteraction([
        makeCandidate('c1', 0),
        makeCandidate('c2', 0),
        makeCandidate('c3', 12),
        makeCandidate('c4', -1),
      ]);
      expect(hopi.id).toBe('c3');
    });

    test('getHighOrderPriorityInteraction should consider priority as "zero" (0) if no priority is defined in interaction', () => {
      const makeCandidate = (id, priority) => ({
        id,
        priority,
      });

      let hopi = linus.getHighOrderPriorityInteraction([
        makeCandidate('c1', null),
        makeCandidate('c2', -5),
      ]);
      expect(hopi.id).toBe('c1');

      hopi = linus.getHighOrderPriorityInteraction([
        makeCandidate('c1', null),
        makeCandidate('c2', 10),
      ]);

      expect(hopi.id).toBe('c2');
    });

    test('getHighOrderPriorityInteraction should throw if 2 interactions have highest priority', () => {
      const makeCandidate = (id, priority) => ({
        id,
        priority,
      });

      const callFn = () =>
        linus.getHighOrderPriorityInteraction([
          makeCandidate('c1', 12),
          makeCandidate('c2', 0),
          makeCandidate('c3', 12),
          makeCandidate('c4', -1),
        ]);
      expect(callFn).toThrow(MultipleInteractionsMatched);
    });

    test('getHighOrderPriorityInteraction should return if single interaction is provided', () => {
      const hopi = linus.getHighOrderPriorityInteraction([
        { id: 'i1', priority: 0 },
      ]);
      expect(hopi.id).toBe('i1');
    });

    test('getHighOrderPriorityInteraction should throw  correctly even if no id for a interaction is provided', () => {
      const callFn = () =>
        linus.getHighOrderPriorityInteraction([
          { priority: 0 },
          { id: 'i', priority: 0 },
        ]);
      expect(callFn).toThrow(MultipleInteractionsMatched);
    });

    test('getTargetInteraction should return highest priority interaction wich condition evalutaes to truthy', () => {
      const makeCandidate = (id, priority, condition) => ({
        id,
        priority,
        condition,
      });

      const hopi = linus.getTargetInteraction(
        [
          makeCandidate('c1', 9999, () => false),
          makeCandidate('c2', 1, () => true),
          makeCandidate('c3', 2, () => true),
        ],
        {}
      );
      expect(hopi.id).toBe('c3');
    });

    test('getTopicTargetInteraction should return highest priority interaction wich condition evalutaes to truthy and belongs to topic', () => {
      // look at testBotData to understand test
      const interaction = linus.getTopicTargetInteraction(
        { id: 'GET_TOPIC_TARGET_INTERACTION' },
        {}
      );
      expect(interaction.id).toBe('target-interaction');
    });

    test('getTopicTargetInteraction should throw if passed topic does NOT have an id attribute', () => {
      // look at testBotData to understand test
      const callFn = () =>
        linus.getTopicTargetInteraction({ tokenizers: ['rootTokenizer'] }, {});
      expect(callFn).toThrow(InvalidTopicIdError);
    });
  });

  describe('LinusDialogBase: Interaction Execution', () => {
    test('resolveStepFeedback should return a Promise that resolves to {Object}feedback value', () => {
      const feedback = { type: 'TEST' };
      return linus
        .resolveStepFeedback(feedback, {})
        .then(resolved => expect(resolved).toMatchObject(feedback));
    });

    test('resolveStepFeedback should return a Promise that resolves to {Function}feedback return value', () => {
      const feedback = { type: 'TEST' };
      const feedbackFn = () => feedback;
      return linus
        .resolveStepFeedback(feedbackFn, {})
        .then(resolved => expect(resolved).toMatchObject(feedback));
    });

    test('resolveStepFeedback should return a Promise that resolves to {Promise}feedback resolved value', () => {
      const feedback = { type: 'TEST' };
      const feedbackPromise = async () => feedback;
      return linus
        .resolveStepFeedback(feedbackPromise, {})
        .then(resolved => expect(resolved).toMatchObject(feedback));
    });

    test('resolveStepFeedback should call {Function}feedback passing context and passed feedback', () => {
      const feedbackFn = (context, feedback) => [
        context.message,
        feedback.type,
      ];
      return linus
        .resolveStepFeedback(feedbackFn, { message: 'test' }, { type: 'test2' })
        .then(resolved =>
          expect(resolved).toEqual(expect.arrayContaining(['test', 'test2']))
        );
    });

    test('runAction should execute every step feedback in action', () => {
      const mockFn = (name, retVal) =>
        jest
          .fn()
          .mockName(name)
          .mockReturnValue(retVal);
      const fn1 = mockFn('fn1', 1);
      const fn2 = mockFn('fn2', 2);
      const steps = [
        { feedback: fn1 },
        { feedback: { type: 'test' } },
        { feedback: fn2 },
      ];

      return linus.runAction({ steps }, {}).then(() => {
        expect(fn1).toHaveBeenCalledTimes(1);
        expect(fn2).toHaveBeenCalledTimes(1);
      });
    });

    // TODO: what if feedback returns null or undefined???

    test('runAction should execute every step in action synchronously ', () => {
      const feedbackFn = delay => () =>
        wait(delay).then(() => performance.now());
      const steps = [
        { feedback: feedbackFn(300) },
        { feedback: feedbackFn(100) },
        { feedback: feedbackFn(200) },
      ];

      return linus.runAction({ steps }, {}).then(({ feedbacks }) => {
        const f0 = feedbacks[0];
        const f1 = feedbacks[1];
        const f2 = feedbacks[2];
        expect(f2).toBeLessThan(f1);
        expect(f1).toBeLessThan(f0);
      });
    });

    test('runAction should execute every step in action passing the last feedback return to the next {Function}feedback', () => {
      const feedbackFn = delay => (context, lastFeedback = 0) =>
        wait(delay).then(() => lastFeedback + 1);
      const steps = [
        { feedback: feedbackFn(300) },
        { feedback: feedbackFn(100) },
        { feedback: feedbackFn(200) },
      ];
      return linus.runAction({ steps }, {}).then(({ feedbacks }) => {
        expect(feedbacks).toEqual([3, 2, 1]);
      });
    });

    test('runAction should return a array of feedbacks action steps concatenated w/ passed feedbacks in the inverse order of execution', () => {
      const feedbackFn = (delay, value) => () => wait(delay).then(() => value);
      const steps = [
        { feedback: feedbackFn(300, '1') },
        { feedback: feedbackFn(100, '2') },
        { feedback: feedbackFn(200, '3') },
      ];
      const initialFeedbacks = ['A', 'B', 'C'];
      return linus
        .runAction({ steps }, {}, initialFeedbacks)
        .then(({ feedbacks }) => {
          expect(feedbacks).toEqual(['3', '2', '1', 'A', 'B', 'C']);
        });
    });

    // TODO: implement
    // test('runAction should apply feedback before next step execution', () => {});
    // test('runAction should call event before next step execution', () => {});

    test('runInteraction should run every candidate action', () => {
      const actions = [
        {
          condition: () => true,
          testId: 1,
          steps: [{ feedback: 1 }],
        },
        {
          condition: () => false,
          testId: 2,
          steps: [{ feedback: 2 }],
        },
        {
          condition: c => c.conditionalReturn,
          testId: 3,
          steps: [{ feedback: 3 }],
        },
      ];

      const context = { conditionalReturn: true };
      const fnMock = jest
        .fn()
        .mockName('runActionMock')
        .mockReturnValue('');
      const srcRunAction = linus.runAction;
      // Mock linus.runAction

      linus.runAction = (...args) => {
        fnMock(...args);
        return srcRunAction(...args);
      };

      return linus.runInteraction({ actions }, context).then(() => {
        expect(fnMock).toHaveBeenCalledTimes(2);
        expect(fnMock.mock.calls[0]).toEqual([actions[0], context, []]);
        expect(fnMock.mock.calls[1]).toEqual([actions[2], context, [1]]);
      });
    });

    test('runInteraction should return all actions feedbacks in the inverse order of execution', () => {
      const actions = [
        {
          condition: () => true,
          testId: 1,
          steps: [{ feedback: 1 }],
        },
        {
          condition: () => false,
          testId: 2,
          steps: [{ feedback: 2 }],
        },
        {
          condition: c => c.conditionalReturn,
          testId: 3,
          steps: [{ feedback: 3 }],
        },
      ];

      const context = { conditionalReturn: true };
      const fnMock = jest
        .fn()
        .mockName('runActionMock')
        .mockReturnValue('');
      const srcRunAction = linus.runAction;
      // Mock linus.runAction

      linus.runAction = (...args) => {
        fnMock(...args);
        return srcRunAction(...args);
      };

      return linus
        .runInteraction({ actions }, context)
        .then(({ feedbacks }) => {
          expect(feedbacks).toEqual([3, 1]);
        });
    });
  });

  describe('LinusDialogBase: Handle feedbacks', () => {
    test('feedback type SET_CONTEXT should call setContext function', () => {
      const fnMock = jest.fn().mockName('setContextMock');
      const srcFn = linus.setContext;
      linus.setContext = (...args) => {
        fnMock(...args);
        return srcFn(...args);
      };
      const initialContext = {};
      const feedbacks = [{ type: 'SET_CONTEXT', payload: { foo: 'bar' } }];

      linus.handleFeedbacks(feedbacks, initialContext);
      expect(fnMock).toHaveBeenCalledTimes(1);
    });

    test('feedback type SET_CONTEXT should emit stepDidSetContext & contextDidUpdate event on reply feedback w/ args', () => {
      const changedContext = { env: {}, foo: 'bar', safe: {} };
      const feedbacks = [
        { type: 'SET_CONTEXT', payload: { foo: 'bar', safe: {} } },
      ];
      const initialContext = { safe: { baz: 'baz' } };

      const mockSetContext = jest.fn().mockName('stepDidSetContext');
      const mockContextDidUpdate = jest.fn().mockName('stepContextDidUpdate');
      linus.on('stepDidSetContext', mockSetContext);
      linus.on('contextDidUpdate', mockContextDidUpdate);
      linus.handleFeedbacks(feedbacks, initialContext);
      expect(mockSetContext).toBeCalledWith(
        feedbacks[0],
        initialContext,
        changedContext
      );
      expect(mockContextDidUpdate).toBeCalledWith(
        feedbacks[0],
        initialContext,
        changedContext
      );
    });

    test('feedback type MERGE_CONTEXT should call enrichContext function', () => {
      const fnMock = jest.fn().mockName('enrichContextMock');
      const srcFn = linus.enrichContext;
      linus.enrichContext = (...args) => {
        fnMock(...args);
        return srcFn(...args);
      };
      const initialContext = {};
      const feedbacks = [{ type: 'MERGE_CONTEXT', payload: { foo: 'bar' } }];

      linus.handleFeedbacks(feedbacks, initialContext);
      expect(fnMock).toHaveBeenCalledTimes(1);
    });

    test('feedback type MERGE_CONTEXT should emit stepDidMergeContext & contextDidUpdate event on reply feedback w/ args', () => {
      const changedContext = { env: {}, foo: 'bar', safe: {} };
      const feedbacks = [{ type: 'MERGE_CONTEXT', payload: changedContext }];
      const initialContext = {};

      const mockMergeContext = jest.fn().mockName('stepDidMergeContext');
      const mockContextDidUpdate = jest.fn().mockName('stepContextDidUpdate');
      linus.on('stepDidMergeContext', mockMergeContext);
      linus.on('contextDidUpdate', mockContextDidUpdate);
      linus.handleFeedbacks(feedbacks, initialContext);
      expect(mockMergeContext).toBeCalledWith(
        feedbacks[0],
        initialContext,
        changedContext
      );
      expect(mockContextDidUpdate).toBeCalledWith(
        feedbacks[0],
        initialContext,
        changedContext
      );
    });

    test('feedback type SET_TOPIC should call setTopic function', () => {
      const fnMock = jest.fn().mockName('setTopic');
      const srcFn = linus.setTopic;
      linus.setTopic = (...args) => {
        fnMock(...args);
        return srcFn(...args);
      };
      const initialContext = {};
      const feedbacks = [{ type: 'SET_TOPIC', payload: 'ROOT' }];

      linus.handleFeedbacks(feedbacks, initialContext);
      expect(fnMock).toHaveBeenCalledTimes(1);
    });

    test('feedback type SET_TOPIC should emit stepDidSetTopic & contextDidUpdate event on reply feedback w/ args', () => {
      const changedContext = { env: { topicId: 'ROOT' } };
      const feedbacks = [{ type: 'SET_TOPIC', payload: 'ROOT' }];
      const initialContext = {};

      const mockSetTopic = jest.fn().mockName('stepDidSetTopic');
      const mockContextDidUpdate = jest.fn().mockName('stepContextDidUpdate');
      linus.on('stepDidSetTopic', mockSetTopic);
      linus.on('contextDidUpdate', mockContextDidUpdate);
      linus.handleFeedbacks(feedbacks, initialContext);
      expect(mockSetTopic).toBeCalledWith(
        feedbacks[0],
        initialContext,
        changedContext
      );
      expect(mockContextDidUpdate).toBeCalledWith(
        feedbacks[0],
        initialContext,
        changedContext
      );
    });

    test('feedback type REPLY should not throw or call context manipulation functions', () => {
      const mockFn = fnName => {
        const fnMock = jest.fn().mockName(`${fnName}Mock`);
        const srcFn = linus[fnName];
        linus[fnName] = (...args) => {
          fnMock(...args);
          return srcFn(...args);
        };
        return fnMock;
      };
      const mockSetContext = mockFn('setContext');
      const mockSetTopic = mockFn('setTopic');
      const mockEnrichcontext = mockFn('enrichContext');

      const initialContext = {};
      const feedbacks = [{ type: 'REPLY', payload: 'Some text' }];

      const callFn = () => linus.handleFeedbacks(feedbacks, initialContext);
      expect(callFn).not.toThrow();
      expect(mockSetContext).not.toBeCalled();
      expect(mockSetTopic).not.toBeCalled();
      expect(mockEnrichcontext).not.toBeCalled();
    });

    test('feedback type REPLY should emit stepDidReply event on reply feedback w/ args', () => {
      const feedbacks = [{ type: 'REPLY', payload: 'Some text' }];
      const initialContext = {};

      const fnMock = jest.fn().mockName('stepDidReplyCallback');
      linus.on('stepDidReply', fnMock);
      linus.handleFeedbacks(feedbacks, initialContext);
      expect(fnMock).toBeCalledWith(
        feedbacks[0],
        initialContext,
        initialContext
      );
    });

    test('feedback w/ flowActions BREAK should further steps execution', async () => {
      const feedbacks = [
        { type: 'REPLY', payload: '0' },
        { type: 'REPLY', payload: '1', meta: { flowActions: ['BREAK'] } },
        { type: 'REPLY', payload: '2' },
      ];
      const initialContext = {};
      const { feedbacks: retFeedbacks } = await linus.handleFeedbacks(
        feedbacks,
        initialContext
      );
      expect(retFeedbacks).toEqual([feedbacks[1], feedbacks[0]]);
    });

    test('feedback w/ flowActions RESOLVE_AGAIN should call resolveContext', async () => {
      const feedbacks = [
        { type: 'REPLY', payload: '1' },
        {
          type: 'REPLY',
          payload: '2',
          meta: { flowActions: ['BREAK', 'RESOLVE_AGAIN'] },
        },
        { type: 'REPLY', payload: '3' },
      ];

      const initialContext = {};
      // mock resolveContext
      const fnMock = jest.fn().mockName('mockResolveContext');
      linus.resolveContext = context => {
        fnMock();
        return {
          feedbacks: [],
          context,
        };
      };
      await linus.handleFeedbacks(feedbacks, initialContext);
      expect(fnMock).toHaveBeenCalledTimes(1);
    });

    test('feedback w/ flowActions RESOLVE_AGAIN should retrun all feedbacks including resolveContext returned ones', async () => {
      const feedbacks = [
        { type: 'REPLY', payload: '1' },
        {
          type: 'REPLY',
          payload: '2',
          meta: { flowActions: ['BREAK', 'RESOLVE_AGAIN'] },
        },
        { type: 'REPLY', payload: '3' },
      ];
      const recursiveFeedbacks = [
        { type: 'REPLY', payload: 'recursive_2' },
        { type: 'REPLY', payload: 'recursive_1' },
      ];
      const initialContext = {};
      // mock resolveContext
      const fnMock = jest.fn().mockName('mockResolveContext');
      linus.resolveContext = context => {
        fnMock();
        return {
          feedbacks: recursiveFeedbacks,
          context,
        };
      };
      const { feedbacks: retFeedbacks } = await linus.handleFeedbacks(
        feedbacks,
        initialContext
      );
      expect(fnMock).toHaveBeenCalledTimes(1);
      expect(retFeedbacks).toEqual([
        ...recursiveFeedbacks,
        feedbacks[1],
        feedbacks[0],
      ]);
    });

    test('next feedback should receive updated context', () => {
      const feedbacks = [
        { type: 'MERGE_CONTEXT', payload: { foo: 0 } },
        { type: 'MERGE_CONTEXT', payload: { bar: 1 } },
        { type: 'MERGE_CONTEXT', payload: { baz: 2 } },
      ];

      const { context: retContext } = linus.handleFeedbacks(feedbacks, {});
      expect(retContext).toMatchObject({ foo: 0, bar: 1, baz: 2 });
    });

    test('feedback w/ custom type should not call setContext function', () => {
      const mockFn = fnName => {
        const fnMock = jest.fn().mockName(`${fnName}Mock`);
        const srcFn = linus[fnName];
        linus[fnName] = (...args) => {
          fnMock(...args);
          return srcFn(...args);
        };
        return fnMock;
      };

      const mockSetContext = mockFn('setContext');
      const mockSetTopic = mockFn('setTopic');
      const mockEnrichcontext = mockFn('enrichContext');

      const initialContext = {};
      const feedbacks = [
        { type: 'CUSTOM_FEEDBACK_TYPE', payload: 'Some text' },
      ];

      const callFn = () => linus.handleFeedbacks(feedbacks, initialContext);
      expect(callFn).not.toThrow();
      expect(mockSetContext).not.toBeCalled();
      expect(mockSetTopic).not.toBeCalled();
      expect(mockEnrichcontext).not.toBeCalled();
    });
  });

  describe('LinusDialogBase: Set Topic', () => {
    test('Should change topicId in context object to passed id in payload', () => {
      const context = linus.setTopic(
        { [LINUS_INTERNAL_ATTR]: { topicId: 'foo' } },
        'ROOT'
      );
      expect(context).toMatchObject({
        [LINUS_INTERNAL_ATTR]: { topicId: 'ROOT' },
      });
    });

    test('Should throw if topicId passed id in payload is unknown', () => {});
  });

  describe('LinusDialogBase: Set Context', () => {
    test('Should replace non SAFE/INTERNAL attributes', () => {
      const initialContext = { foo: 'fooVal' };
      const tokens2Merge = { bar: 'barVal' };
      const enriched = linus.setContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        bar: 'barVal',
      });
    });

    test('Should change existing attributes in context', () => {
      const initialContext = { foo: 'fooVal', bar: 'barVal' };
      const tokens2Merge = { foo: 'fooValNew', bar: undefined };
      const enriched = linus.setContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject(tokens2Merge);
    });

    test('Should change existing attributes in context', () => {
      const initialContext = { foo: 'fooVal' };
      const tokens2Merge = { foo: 'fooValNew' };
      const enriched = linus.setContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        foo: 'fooValNew',
      });
    });

    test('INTERNAL_ATTR should be remain untouched', () => {
      const initialContext = {
        foo: 'fooVal',
        [LINUS_INTERNAL_ATTR]: { foo: 'fooVal', bar: 'barVal' },
      };
      const tokens2Merge = {
        foo: 'fooValNew',
        [LINUS_INTERNAL_ATTR]: { foo: 'fooValNew', baz: 'bazVal' },
      };
      const enriched = linus.setContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        foo: 'fooValNew',
        [LINUS_INTERNAL_ATTR]: { foo: 'fooVal', bar: 'barVal' },
      });
    });

    test('SAFE_ATTR should be replaced if explicity defined', () => {
      const initialContext = {
        foo: 'fooVal',
        [LINUS_SAFE_ATTR]: { foo: 'fooVal', bar: 'barVal' },
      };
      const tokens2Merge = {
        foo: 'fooValNew',
        [LINUS_SAFE_ATTR]: { baz: 'bazVal' },
      };
      const enriched = linus.setContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        foo: 'fooValNew',
        [LINUS_SAFE_ATTR]: { baz: 'bazVal' },
      });
    });

    test('SAFE_ATTR should NOT be replaced if NOT explicity defined', () => {
      const initialContext = {
        foo: 'fooVal',
        [LINUS_SAFE_ATTR]: { foo: 'fooVal', bar: 'barVal' },
      };
      const tokens2Merge = {
        foo: 'fooValNew',
      };
      const enriched = linus.setContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        foo: 'fooValNew',
        [LINUS_SAFE_ATTR]: { foo: 'fooVal', bar: 'barVal' },
      });
    });
  });

  describe('LinusDialogBase: Enrich Context', () => {
    test('Should add new attributes to context', () => {
      const initialContext = { foo: 'fooVal' };
      const tokens2Merge = { bar: 'barVal' };
      const enriched = linus.enrichContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        foo: 'fooVal',
        bar: 'barVal',
      });
    });

    test('Should change existing attributes in context', () => {
      const initialContext = { foo: 'fooVal', bar: 'barVal' };
      const tokens2Merge = { foo: 'fooValNew', bar: undefined };
      const enriched = linus.enrichContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject(tokens2Merge);
    });

    test('Should change existing attributes in context', () => {
      const initialContext = { foo: 'fooVal' };
      const tokens2Merge = { foo: 'fooValNew' };
      const enriched = linus.enrichContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        foo: 'fooValNew',
      });
    });

    test('INTERNAL_ATTR should be remain untouched', () => {
      const initialContext = {
        foo: 'fooVal',
        [LINUS_INTERNAL_ATTR]: { foo: 'fooVal', bar: 'barVal' },
      };
      const tokens2Merge = {
        foo: 'fooValNew',
        [LINUS_INTERNAL_ATTR]: { foo: 'fooValNew', baz: 'bazVal' },
      };
      const enriched = linus.enrichContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        foo: 'fooValNew',
        [LINUS_INTERNAL_ATTR]: { foo: 'fooVal', bar: 'barVal' },
      });
    });

    test('SAFE_ATTR should be deep merged', () => {
      const initialContext = {
        foo: 'fooVal',
        [LINUS_SAFE_ATTR]: { foo: 'fooVal', bar: 'barVal' },
      };
      const tokens2Merge = {
        foo: 'fooValNew',
        [LINUS_SAFE_ATTR]: { foo: 'fooValNew', baz: 'bazVal' },
      };
      const enriched = linus.enrichContext(initialContext, tokens2Merge);
      expect(enriched).toMatchObject({
        foo: 'fooValNew',
        [LINUS_SAFE_ATTR]: {
          foo: 'fooValNew',
          bar: 'barVal',
          baz: 'bazVal',
        },
      });
    });
  });

  describe('LinusDialogBase: Events', () => {
    test('Should emit an event', () => {
      let emittedData = null;
      linus.on('customEvent', data => {
        emittedData = data;
      });
      const mockFn = jest.fn().mockName('customEventListener');
      linus.on('customEvent', mockFn);
      linus.emit('customEvent', 'test');
      expect(emittedData).toBe('test');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('registerEventHandler should register functions for events', () => {
      const mock1 = jest.fn().mockName('evt1');
      const mock2 = jest.fn().mockName('evt2');
      linus.registerEventHandlers({ evt1: mock1, evt2: mock2 });
      linus.emit('evt1', 'test1');
      linus.emit('evt2', 'test2');
      expect(mock1).toHaveBeenCalledTimes(1);
      expect(mock2).toHaveBeenCalledTimes(1);
    });
  });
});
