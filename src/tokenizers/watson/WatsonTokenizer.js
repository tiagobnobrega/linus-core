import AssistantV1 from 'watson-developer-cloud/assistant/v1';
import requiredParam from '../../utils/requiredParam';

import { wait } from '../../utils/test/helpers';

// nlp: {
//   minConfidence: 0.6,
//     mergeStrategy: ['intents', 'entities'],
// },

export const LATEST_VERSION = '2018-02-16';

const WatsonTokenizer = ({
  id = 'watsonTokenizer',
  username = requiredParam('username'),
  password = requiredParam('passwork'),
  workspaceId = requiredParam('workspaceId'),
  version = LATEST_VERSION,
}) => {
  const me = {};

  const assistant = new AssistantV1({
    username,
    password,
    version,
  });

  /**
   * Builds Watson service call payload
   * @param msg
   * @return {{workspace_id: void, input: {text: *}, context: null}}
   */
  const buildPayload = msg => ({
    workspace_id: workspaceId,
    input: {
      text: msg,
    },
    context: null,
  });

  /**
   * Calls watson service.
   * @param msg
   * @return {Promise<any>}
   */
  const callService = msg =>
    new Promise((resolve, reject) =>
      assistant.message(buildPayload(msg), (err, data) => {
        if (err) {
          // eslint-disable-next-line no-param-reassign
          err.data = data;
          reject(err);
        } else {
          resolve(data);
        }
      })
    );

  /**
   * This method normalizes Watson service response to conform w/ linus default NLP attributes.
   * This should be consistent to allow interchanging different ai services.
   * @param aiResponse
   */
  const normalizeResponse = aiResponse => ({ intents: [], entities: {} });


  me.id = id;
  me.tokenize = async (msg, topic) => {
    const aiResponse = await callService(msg);
    console.log('aiResponse:', aiResponse);
  };

  return me;
};

export default WatsonTokenizer;
