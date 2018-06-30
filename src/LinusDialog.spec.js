import debug from 'debug';
import LinusDialog from './LinusDialog';
import botTestData from './utils/test/test-bot-data';

// globals:
let linus = new LinusDialog(botTestData);
let repliedMessages = [];
// Handler factory that resolves to a fixed context on any message
const fixedContextHandler = obj => ({
  tokenizers: [{ id: 'globalTokenizer', tokenize: () => obj }],
});
const repliedMessagesHandler = {
  events: {
    stepDidReply: (feedback, context) => {
      repliedMessages.push(feedback.payload.content);
      return context;
    },
  },
};
// Setup & shutdown
beforeAll(() => {
  // debug.enable('linus:LinusDialog:trace');
});

afterAll(() => {
  // debug.disable('linus:LinusDialog:trace');
});

// Before each test set new fresh instance
beforeEach(() => {
  linus = new LinusDialog(botTestData);
  linus.use({
    tokenizers: [{ id: 'rootGlobalTokenizer', tokenize: () => ({}) }],
  });
  repliedMessages = [];
  linus.use(repliedMessagesHandler);
});

describe('LinusDialog integrated tests', () => {
  describe('Specific interactions', () => {
    test('Should run a simple reply interaction', async () => {
      const initialContext = {};
      linus.use(fixedContextHandler({ intents: { hi: true } }));
      const { feedbacks, context } = await linus.resolve('Hi', initialContext);
      expect(feedbacks[0]).toMatchObject({
        type: 'REPLY',
        payload: { type: 'text', content: 'Hi, how may I assist You ?' },
      });

      expect(context).toMatchObject({
        env: { topicId: 'ROOT' },
        intents: { hi: true },
      });
      expect(repliedMessages).toContain('Hi, how may I assist You ?');
    });

    test('Should run a simple function reply interaction', async () => {
      const initialContext = {};
      linus.use(fixedContextHandler({ intents: { hiFunction: true } }));
      const { feedbacks, context } = await linus.resolve('Hi', initialContext);
      expect(feedbacks[0]).toMatchObject({
        type: 'REPLY',
        payload: { content: 'Hi, how may I assist You ?', type: 'text' },
      });

      expect(context).toMatchObject({
        env: { topicId: 'ROOT' },
        intents: { hiFunction: true },
      });
      expect(repliedMessages).toContain('Hi, how may I assist You ?');
    });

    test('Should handle set dialog w/ resolve again', async () => {
      const initialContext = {};
      linus.use(fixedContextHandler({ intents: { movieSuggestion: [''] } }));
      const { context } = await linus.resolve('Any', initialContext);

      expect(context).toMatchObject({
        env: { topicId: 'MOVIE_SUGGESTION' },
      });
      expect(repliedMessages).toContain(
        'What kind of movie would you like to watch? And should it be a good or a bad movie ?'
      );
    });
  });
});
