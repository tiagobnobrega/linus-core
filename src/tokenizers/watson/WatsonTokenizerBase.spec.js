// import AssistantV1 from 'watson-developer-cloud/assistant/v1';
import WatsonTokenizerBase, { LATEST_VERSION } from './WatsonTokenizerBase';
import requiredParam from '../../utils/requiredParam';
import _omit from 'lodash/omit';

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
      entity: 'entity_100',
      location: [0, 10],
      value: 'entity_100',
      confidence: 1,
    },
    {
      entity: 'entity_100',
      location: [12, 24],
      value: 'entity_100_2',
      confidence: 1,
    },
    {
      entity: 'entity_30',
      location: [26, 35],
      value: 'entity_30',
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
        entity_100: ['entity_100', 'entity_100_2'],
        entity_30: ['entity_30'],
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
        entity_100: ['entity_100', 'entity_100_2'],
      },
      entitiesEx: [
        {
          entity: 'entity_100',
          location: [0, 10],
          value: 'entity_100',
          confidence: 1,
        },
        {
          entity: 'entity_100',
          location: [12, 24],
          value: 'entity_100_2',
          confidence: 1,
        },
      ],
    });

    expect(normalized.entities).not.toHaveProperty('entity_30');
    normalized.entitiesEx.forEach(e => {
      expect(e.entity).not.toBe('entity_30');
    });
  });

  test('normalizeResponse should transform watson response into linus entities & intents format', async () => {
    const normalized = tokenizer.normalizeResponse(watsonMessage, {
      ...defaultTokenizerArgs.nlp,
      intentMinConfidence: 0,
      entityMinConfidence: 0,
    });
    expect(normalized).toMatchObject({
      intents: ['intent_90', 'intent_50', 'intent_30', 'intent_20'],
      intentsEx: [
        { intent: 'intent_90', confidence: expect.any(Number) },
        { intent: 'intent_50', confidence: expect.any(Number) },
        { intent: 'intent_30', confidence: expect.any(Number) },
        { intent: 'intent_20', confidence: expect.any(Number) },
      ],
      entities: {
        entity_100: ['entity_100', 'entity_100_2'],
        entity_30: ['entity_30'],
      },
      entitiesEx: watsonMessage.entities,
    });
  });

  test('normalizeResponse should filter out entities & intents with confidence below minimum', async () => {
    const normalized = tokenizer.normalizeResponse(
      watsonMessage,
      defaultTokenizerArgs.nlp
    );
    expect(normalized).toMatchObject({
      intents: ['intent_90'],
      intentsEx: [{ intent: 'intent_90', confidence: expect.any(Number) }],
      entities: {
        entity_100: ['entity_100', 'entity_100_2'],
      },
      entitiesEx: [
        {
          entity: 'entity_100',
          location: [0, 10],
          value: 'entity_100',
          confidence: 1,
        },
        {
          entity: 'entity_100',
          location: [12, 24],
          value: 'entity_100_2',
          confidence: 1,
        },
      ],
    });
  });

  test('getTopicNlpParams should return topic nlp params from linus pre-defined attrs', async () => {
    const nlpParams = tokenizer.getTopicNlpParams(defaultTokenizerArgs); // defaultTokenizerArgs has topic nlp attrs
    expect(nlpParams).toMatchObject({
      intentMinConfidence: expect.any(Number),
      entityMinConfidence: expect.any(Number),
      mergeStrategy: expect.any(Array),
    });
  });

  test('getTopicNlpParams should return default tokenizer nlp params containing linus pre-defined attrs', async () => {
    const nlpParams = tokenizer.getTopicNlpParams();
    expect(nlpParams).toMatchObject({
      intentMinConfidence: expect.any(Number),
      entityMinConfidence: expect.any(Number),
      mergeStrategy: expect.any(Array),
    });
  });

  test('filterMergeStrategyAttrs should return object containing only merge strategy defined attributes', async () => {
    const intents = ['IntentA'];
    const entities = { foo: 'foo', bar: 'bar' };
    const tokens = {
      foo: 'foo',
      intents,
      entities,
    };

    let attrsToMerge = tokenizer.filterMergeStrategyAttrs(tokens, [
      'entities',
      'intents',
    ]);
    expect(attrsToMerge).toMatchObject({ intents, entities });

    attrsToMerge = tokenizer.filterMergeStrategyAttrs(tokens, ['entities']);
    expect(attrsToMerge).toMatchObject({ entities });

    attrsToMerge = tokenizer.filterMergeStrategyAttrs(tokens, ['intents']);
    expect(attrsToMerge).toMatchObject({ intents });
  });

  test('tokenize should return tokenized object using confidence and mergeStrategy from topic in linus format', async () => {
    const mock = jest.fn();
    mock.mockReturnValue(watsonMessage);
    const mockAssistant = {
      message: (payload, cb) => {
        cb(null, mock(payload));
      },
    };
    const msg = 'test';
    tokenizer.setAssistant(mockAssistant);
    const tokens = await tokenizer.tokenize(msg, {
      ...defaultTokenizerArgs.nlp,
      intentMinConfidence: 0.6,
      entityMinConfidence: 0.6,
    });
    expect(tokens).toMatchObject({});
  });

  test('tokenize should throw error if assistant message functions errors', async () => {
    const mock = jest.fn();
    mock.mockReturnValue(watsonMessage);
    const mockAssistant = {
      message: (payload, cb) => {
        cb(new Error('Test Error'), mock(payload));
      },
    };
    const msg = 'test';
    tokenizer.setAssistant(mockAssistant);

    expect.assertions(1);
    try {
      await tokenizer.tokenize(msg, {
        ...defaultTokenizerArgs.nlp,
        intentMinConfidence: 0.6,
        entityMinConfidence: 0.6,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
    }
  });

  describe('Default parameter branches', () => {
    test('constructor', () => {
      const buildIt = omitted => () =>
        new WatsonTokenizerBase(_omit(defaultTokenizerArgs, omitted));
      expect(buildIt(['id', 'version', 'nlp'])).not.toThrow();
      expect(buildIt(['username'])).toThrow(/Required parameter/);
      expect(buildIt(['password'])).toThrow(/Required parameter/);
      expect(buildIt(['workspaceId'])).toThrow(/Required parameter/);
    });

    test('normalizeResponse', () => {
      expect(() => tokenizer.normalizeResponse()).toThrow(/Required parameter/);
    });

    test('normalizeIntents', () => {
      expect(() => tokenizer.normalizeIntents()).toThrow(/Required parameter/);
    });

    test('normalizeEntities', () => {
      expect(() => tokenizer.normalizeEntities()).toThrow(/Required parameter/);
    });

    test('filterMergeStrategyAttrs', () => {
      expect(() => tokenizer.filterMergeStrategyAttrs()).not.toThrow();
    });
  });
});
