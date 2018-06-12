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
      repliedMessages.push(feedback.payload);
      return context;
    },
  },
};

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
      console.log('resolving...');
      const { feedbacks, context } = await linus.resolve('Hi', initialContext);
      console.log('resolved...');
      expect(feedbacks[0]).toMatchObject({
        type: 'REPLY',
        payload: { type: 'text', content: 'Hi, how may I assist You ?' },
      });

      expect(context).toMatchObject({ env: { topicId: 'ROOT' } });
      console.log('Done!!!!');
    });
  });
});
