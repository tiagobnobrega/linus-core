// import AssistantV1 from 'watson-developer-cloud/assistant/v1';
import WatsonTokenizerBase, { LATEST_VERSION } from './WatsonTokenizerBase';

// .env file must be located inside watson folder;
require('dotenv').config();

// globals:
let tokenizer = null;
const defaultTokenizerArgs = {
  id: 'testTokenizer',
  username: 'testUsername',
  password: 'testPassword',
  workspaceId: 'testWorkspaceId',
  version: LATEST_VERSION,
  nlp: {
    intentMinConfidence: 0.6,
    entityMinConfidence: 0.6,
    mergeStrategy: ['intents', 'entities'],
  },
};

const watsonMessage = {
  intents: [
    {
      intent: 'intent_90',
      confidence: 0.9063647842407228,
    },
    {
      intent: 'intent_50',
      confidence: 0.5077286791801453,
    },
    {
      intent: 'intent_30',
      confidence: 0.3,
    },
    {
      intent: 'intent_20',
      confidence: 0.2048438811302185,
    },
  ],
  entities: [
    {
      entity: 'intent_100',
      location: [0, 10],
      value: 'intent_100',
      confidence: 1,
    },
    {
      entity: 'intent_100',
      location: [12, 24],
      value: 'intent_100_2',
      confidence: 1,
    },
    {
      entity: 'intent_30',
      location: [26, 35],
      value: 'intent_30',
      confidence: 0.3,
    },
  ],
  // Other attributes are ignored
};

const buildTokenizer = (args = defaultTokenizerArgs) =>
  new WatsonTokenizerBase(args);

// Setup & shutdown
beforeAll(async () => {
  // debug.enable('linus:LinusDialog:trace');
});

afterAll(() => {
  // debug.disable('linus:LinusDialog:trace');
});

// Before each test set new fresh instance
beforeEach(() => {
  tokenizer = buildTokenizer();
});

describe('WatsonTokenizerBase Tests', () => {
  test('Payload should be built using tokenizer workspaceId', async () => {
    const message = 'test';
    const payload = tokenizer.buildPayload(message);
    expect(payload).toMatchObject({
      workspace_id: defaultTokenizerArgs.workspaceId,
      input: {
        text: message,
      },
      context: null,
    });
  });

  test('callService should call assistant message w/ built payload', async () => {
    const mock = jest.fn();
    const mockAssistant = {
      message: (payload, cb) => {
        cb(mock(payload));
      },
    };
    const msg = 'test';
    tokenizer.setAssistant(mockAssistant);
    await tokenizer.callService(msg);
    expect(mock).toHaveBeenCalled();
    expect(mock).toHaveBeenCalledWith(tokenizer.buildPayload(msg));
  });

  test('normalizeIntents should transform watson response into linus intent format', async () => {
    const normalized = tokenizer.normalizeIntents(watsonMessage.intents, 0);
    expect(normalized).toMatchObject({
      intents: ['intent_90', 'intent_50', 'intent_30', 'intent_20'],
      intentsEx: [
        { intent: 'intent_90', confidence: expect.any(Number) },
        { intent: 'intent_50', confidence: expect.any(Number) },
        { intent: 'intent_30', confidence: expect.any(Number) },
        { intent: 'intent_20', confidence: expect.any(Number) },
      ],
    });
  });

  test('normalizeIntents should filter out intents with confidence below minimum', async () => {
    const normalized = tokenizer.normalizeIntents(watsonMessage.intents, 0.3);
    expect(normalized).toMatchObject({
      intents: ['intent_90', 'intent_50', 'intent_30'],
      intentsEx: [
        { intent: 'intent_90', confidence: expect.any(Number) },
        { intent: 'intent_50', confidence: expect.any(Number) },
        { intent: 'intent_30', confidence: expect.any(Number) },
      ],
    });
  });

  test('normalizeEntities should transform watson response into linus entities format', async () => {
    const normalized = tokenizer.normalizeEntities(watsonMessage.entities, 0);
    expect(normalized).toMatchObject({
      entities: {
        intent_100: ['intent_100', 'intent_100_2'],
        intent_30: ['intent_30'],
      },
      entitiesEx: watsonMessage.entities,
    });
  });

  test('normalizeEntities should filter out entities with confidence below minimum', async () => {
    const normalized = tokenizer.normalizeEntities(
      watsonMessage.entities,
      0.31
    );
    expect(normalized).toMatchObject({
      entities: {
        intent_100: ['intent_100', 'intent_100_2'],
      },
      entitiesEx: [
        {
          entity: 'intent_100',
          location: [0, 10],
          value: 'intent_100',
          confidence: 1,
        },
        {
          entity: 'intent_100',
          location: [12, 24],
          value: 'intent_100_2',
          confidence: 1,
        },
      ],
    });
  });

  test('normalizeResponse should transform watson response into linus entities & intents format', async () => {
    expect('NOT implemented').toBe('implemented');
  });

  test('normalizeResponse should filter out entities & intents with confidence below minimum', async () => {
    expect('NOT implemented').toBe('implemented');
  });

  test('getTopicNlpParams should return topic nlp params from linus pre-defined attrs', async () => {
    expect('NOT implemented').toBe('implemented');
  });

  test('filterMergeStrategyAttrs should return object containing only merge strategy defined attributes', async () => {
    expect('NOT implemented').toBe('implemented');
  });

  test('filterMergeStrategyAttrs should return object containing only merge strategy defined attributes', async () => {
    expect('NOT implemented').toBe('implemented');
  });

  test('tokenize should return tokenized object using confidence and mergeStrategy from topic in linus format', async () => {
    expect('NOT implemented').toBe('implemented');
  });
});
