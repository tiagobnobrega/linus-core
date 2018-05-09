import LinusDialogBase, {
  ConditionScriptError,
  ScriptError,
  InvalidCondition,
  MultipleInteractionsMatched,
} from './LinusDialogBase';
import botTestData from './utils/test/test-bot-data';

import { validTokenizer, testTokenizer } from './utils/test/tokenizers';

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

    test('getInteractionCandidates should return all and only interaction wich condition or is null or evaluates to truthy', () => {
      const makeInteraction = (id, condition) => ({
        id,
        condition,
      });
      const candidates = linus.getInteractionCandidates(
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

    test('getInteractionCandidates should throw if any interaction condition is not null, truthy, falsy or Function', () => {
      const callFn = candidate => () =>
        linus.getInteractionCandidates([candidate], {});
      expect(callFn({ condition: 55 })).toThrow(InvalidCondition);
      expect(callFn({ condition: {} })).toThrow(InvalidCondition);
      expect(callFn({ condition: [] })).toThrow(InvalidCondition);
      expect(callFn({ condition: () => 55 })).not.toThrow();
      expect(callFn({ condition: false })).not.toThrow();
      expect(callFn({ condition: true })).not.toThrow();
      expect(callFn({ condition: null })).not.toThrow();
    });

    

    // test('getHighOrderPriorityInteraction should return the interaction with highest priority', () => {});
    //
    // test('getHighOrderPriorityInteraction should throw if 2 interactions have highest priority', () => {});
    //
    // test('getTargetInteraction should return highest priority interaction wich condition evalutaes to truthy', () => {});
  });
});
