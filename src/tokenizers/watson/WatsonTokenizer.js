import WatsonTokenizerBase, { LATEST_VERSION } from './WatsonTokenizerBase';

const BASE = Symbol('base');
export default class WatsonTokenizer {
  static LATEST_VERSION = LATEST_VERSION;
  constructor(initArgs) {
    this[BASE] = new WatsonTokenizerBase(initArgs);
    this.id = this[BASE].id;
  }
  tokenize = async (msg, topic) => this[BASE].tokenize(msg, topic);
}
