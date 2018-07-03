import EventEmitter from 'eventemitter3/index';
import AssistantV1 from 'watson-developer-cloud/assistant/v1';
import requiredParam from '../../utils/requiredParam';

export const LATEST_VERSION = '2018-02-16';
export default class WatsonTokenizerBase extends EventEmitter {
  constructor({
    id = 'watsonTokenizer',
    username = requiredParam('username'),
    password = requiredParam('password'),
    workspaceId = requiredParam('workspaceId'),
    version = LATEST_VERSION,
    nlp = {
      intentMinConfidence: 0.6,
      entityMinConfidence: 0.6,
      mergeStrategy: ['intents', 'entities'],
    },
  }) {
    super();

    this.assistant = new AssistantV1({
      username,
      password,
      version,
    });
    this.id = id;
    this.workspaceId = workspaceId;
    this.nlp = nlp;
  }

  /**
   * Builds Watson service call payload
   * @param msg
   * @return {{workspace_id: void, input: {text: *}, context: null}}
   */
  buildPayload = msg => ({
    workspace_id: this.workspaceId,
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
  callService = msg =>
    new Promise((resolve, reject) =>
      this.assistant.message(this.buildPayload(msg), (err, data) => {
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
  normalizeResponse = (nlpResponse, nlpParams = requiredParam('nlParams')) => {
    // normalize intents
    const normalizedIntents = this.normalizeIntents(
      nlpResponse.intents,
      nlpParams.intentMinConfidence
    );
    // normalize entities
    const normalizedEntites = this.normalizeEntities(
      nlpResponse.entities,
      nlpParams.entityMinConfidence
    );

    return { ...normalizedIntents, ...normalizedEntites };
  };

  /**
   * Normalize intents array, returning object w/ 2 attributes in Linus normalized patern (wich is Watson defaults).
   * Intents with confidence lower than minConfidence will be filtered out.
   * @param srcIntents
   * @param minConfidence
   * @return {{intents: any[], intentsEx: *[]}}
   */
  normalizeIntents = (
    srcIntents = [],
    minConfidence = requiredParam('minimum confidence')
  ) => {
    // make sure its ordered by confindence. it should be already!
    const filteredIntents = srcIntents.filter(
      i => i.confidence >= minConfidence
    );
    filteredIntents.sort((a, b) => b.confidence - a.confidence);
    const normalIntents = filteredIntents.map(e => e.intent);
    return { intents: normalIntents, intentsEx: filteredIntents };
  };

  /**
   * Normalize intents array, returning object w/ 2 attributes in Linus normalized patern (wich is Watson defaults).
   * Entities with confidence lower than minConfidence will be filtered out.
   * @param srcEntites
   * @param minConfidence
   * @return {{entities: *|{}, entitiesEx: *[]}}
   */
  normalizeEntities = (
    srcEntites = [],
    minConfidence = requiredParam('minimum confidence')
  ) => {
    const filteredEntities = srcEntites.filter(
      i => i.confidence >= minConfidence
    );
    const normalEntities = srcEntites.reduce((acc, curr) => {
      const newAcc = { ...acc };
      newAcc[curr] = newAcc[curr] || [];
      newAcc[curr].push(curr.entity);
      return newAcc;
    }, {});
    const normalEntitiesEx = filteredEntities;
    return { entities: normalEntities, entitiesEx: normalEntitiesEx };
  };

  /**
   * Extract topic ai attribute parameters, or fallback to defaults
   * @param topic
   * @return {{minConfidence: number, mergeStrategy: string[]}}
   */
  getTopicNlpParams = (topic = {}) => {
    const { nlp } = topic;
    return {
      ...nlp,
      ...this.nlp,
    };
  };

  /**
   * Returns new object containing only attributes defined in mergeStrategy
   * @param obj
   * @param mergeStrategy
   */
  filterMergeStrategyAttrs = (obj, mergeStrategy = []) => {
    const filtered = {};
    mergeStrategy.forEach(attr => {
      filtered[attr] = obj[attr];
    });
    return filtered;
  };

  /**
   * Async returns tokens from watson call. It filters entities & intents based on confidence params.
   * Returns object containing only the attributes defined in topic's (or default) mergeStrategy.
   * @param msg
   * @param topic
   * @return {Promise<void>}
   */
  tokenize = async (msg, topic) => {
    const nlpResponse = await this.callService(msg);
    const nlpParams = this.getTopicNlpParams(topic);
    const attrsToMerge = this.normalizeResponse(nlpResponse, nlpParams);
    return this.filterMergeStrategyAttrs(attrsToMerge, nlpParams.mergeStrategy);
  };
}
