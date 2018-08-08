import LinusDialogBase from './LinusDialogBase';

const BASE = Symbol('base');

const exposeGenericMethods = (target, src, methods) => {
  methods.forEach(m => {
    // eslint-disable-next-line no-param-reassign
    target[m] = src[m];
  });
};

export default class LinusDialog {
  constructor(initArgs) {
    this[BASE] = new LinusDialogBase(initArgs);
    exposeGenericMethods(this, this[BASE], [
      'eventNames',
      'listeners',
      'listenerCount',
      'emit',
      'on',
      'addListener',
      'once',
      'removeListener',
      'off',
      'removeAllListeners',
    ]);
  }

  resolve = (message, ctx) => this[BASE].resolve(message, ctx);
  use = handler => this[BASE].use(handler);
  registerTokenizer = (tokenizer, overwrite) =>
    this[BASE].registerTokenizer(tokenizer, overwrite);
}
