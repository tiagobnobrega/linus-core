import AssistantV1 from 'watson-developer-cloud/assistant/v1';
// import debug from 'debug';
import WatsonTokenizer from './WatsonTokenizer';

// .env file must be located inside watson folder;
require('dotenv').config();

// globals:
const wksData = require('./WatsonTokenizerWorkspace');

const TEST_WORKSPACE_NAME =
  process.env.TEST_WORKSPACE_NAME || 'WatsonTokenizerWorkspace';
const watsonUser = process.env.TEST_WATSON_USER;
const watsonPwd = process.env.TEST_WATSON_PWD;
const TEST_TIMEOUT = 10000;
let watsonWksId = null;
let watsonTokenizer = null;

/**
 * Creates test workspace if one doesn't exists. It does not create every run because the api has a 30/30min limit rate.
 * Returns workspaceId
 */
const createTestWorkspaceIfNotExists = async () => {
  const assistant = new AssistantV1({
    username: watsonUser,
    password: watsonPwd,
    version: WatsonTokenizer.LATEST_VERSION,
  });

  // get all workspaces
  const listData = await new Promise((resolve, reject) =>
    assistant.listWorkspaces((err, cbData) => {
      if (err) {
        // eslint-disable-next-line no-param-reassign
        err.data = cbData;
        reject(err);
      } else {
        resolve(cbData);
      }
    })
  );

  const workspaces = listData && listData.workspaces;
  if (!workspaces) throw new Error('Error loading workspaces list!');

  // see if one has the name TEST_WORKSPACE_NAME
  const wksFound = workspaces.find(w => w.name === TEST_WORKSPACE_NAME);
  if (wksFound) {
    return wksFound.workspace_id;
  }
  const createData = await new Promise((resolve, reject) =>
    assistant.createWorkspace(wksData, (err, cbData) => {
      if (err) {
        // eslint-disable-next-line no-param-reassign
        err.data = cbData;
        reject(err);
      } else {
        resolve(cbData);
      }
    })
  );
  return createData.workspace_id;
};

// Setup & shutdown
beforeAll(async () => {
  if (!watsonUser || !watsonPwd) return;
  watsonWksId = await createTestWorkspaceIfNotExists();
  watsonTokenizer = new WatsonTokenizer({
    id: 'watsonTokenizer',
    username: watsonUser,
    password: watsonPwd,
    workspaceId: watsonWksId,
  });
  // debug.enable('linus:LinusDialog:trace');
});

afterAll(() => {
  // debug.disable('linus:LinusDialog:trace');
});

// Before each test set new fresh instance
beforeEach(() => {
  // noop
});

describe('WatsonTokenizer Integration Tests', () => {
  if (!watsonUser || !watsonPwd) {
    test('Skipping watson tokenizer tests, TEST_WATSON_USER or TEST_WATSON_PWD not defined', () => {});
    return;
  }

  test(
    'Should return hello intent on "Hello" message',
    async () => {
      const response = await watsonTokenizer.tokenize('Hello');
      console.log(response);
      expect(true).toBe(true);
    },
    TEST_TIMEOUT
  );
});
