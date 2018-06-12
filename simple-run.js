const { LinusDialog } = require('./lib/linus.node');
const botTestData = require('./src/utils/test/test-bot-data');

console.log('LinusDialog', LinusDialog);

// globals:
const linus = new LinusDialog(botTestData);
const repliedMessages = [];
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

(async () => {
  try {
    const initialContext = {};
    linus.use(fixedContextHandler({ intents: { hi: true } }));
    console.log('resolving...');
    const { feedbacks, context } = await linus.resolve('Hi', initialContext);
    console.log('resolved...');
    // expect(feedbacks[0]).toMatchObject({
    //   type: 'REPLY',
    //   payload: { type: 'text', content: 'Hi, how may I assist You ?' },
    // });
    //
    // expect(context).toMatchObject({ env: { topicId: 'ROOT' } });
    // console.log('Done!!!!');
  } catch (e) {
    console.log('Error', e);
  }
})();
