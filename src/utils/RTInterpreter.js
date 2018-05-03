import extendError from './extendError';

const _ = require('lodash');
const vm = require('vm');

export class RTInterpreterError extends extendError() {}

export default (sandboxScope = {}) => {
  const sandbox = vm.createContext(
    _.merge(sandboxScope, { module: { exports: null } })
  );
  const me = {};

  me.require = code => {
    if (!(typeof code === 'string')) {
      throw new RTInterpreterError(
        `Cannot compile code ${code}. Only strings allowed`
      );
    }
    sandbox.module.exports = null;
    try {
      vm.runInNewContext(`module.exports = ${code}`, sandbox);
    } catch (e) {
      // throw new RTInterpreterError('Error interpreting source code.', e);
      throw new RTInterpreterError('Error interpreting source code.');
    }
    return sandbox.module.exports;
  };
  me.interpretAttributes = (obj, ...attrs) => {
    attrs.forEach(attr => {
      const attrVal = obj[attr];
      if (!attrVal) return;
      if (!(typeof attrVal === 'string')) {
        throw new RTInterpreterError(
          `Cannot compile attribute ${attr}. Only strings allowed`
        );
      }
      // eslint-disable-next-line no-param-reassign
      obj[attr] = me.require(attrVal);
    });
  };
  return me;
};

