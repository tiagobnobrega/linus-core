import LinusDialogBase from './LinusDialogBase';
// TODO Remover baseFn ????
const BASE = Symbol('base');
const BASE_FN = Symbol('baseFn');
const baseFn = obj => method => args => {
  obj[method](...args);
};

export default class LinusDialog {
  constructor(initArgs) {
    this[BASE] = new LinusDialogBase(initArgs);
    this[BASE_FN] = baseFn(this[BASE]);
  }

  resolve = (message, ctx) => this[BASE].resolve(message, ctx);
  use = handler => this[BASE].use(handler);
  registerTokenizer = (tokenizer, overwrite) =>
    this[BASE].registerTokenizer(tokenizer, overwrite);
  // TODO: Remover baseFn???? registerTokenizer = this[BASE_FN]('registerTokenizer');
}
