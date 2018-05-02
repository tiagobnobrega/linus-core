import extendError from './extendError';

const _ = require('lodash');
const vm = require('vm');

class RTInterpreterError extends extendError() {};

const RTInterpreter = (sandboxScope = {}) => {
  const sandbox = vm.createContext(
    _.merge(sandboxScope, { module: { exports: null } })
  );
  const me = {};

  me.require = code => {
    if (!(typeof code === 'string')) {
      throw new RTInterpreterError(`Cannot compile code ${code}. Only strings allowed`);
    }
    sandbox.module.exports = null;
    try {
      vm.runInNewContext(code, sandbox);
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
      if (!(typeof attr === 'string')) {
        throw new RTInterpreterError(
          `Cannot compile attribute ${attr}. Only strings allowed`
        );
      }
      const code = `module.exports = ${attrVal}`;
      // eslint-disable-next-line no-param-reassign
      obj[attr] = me.require(code);
    });
  };
  return me;
};

module.exports = RTInterpreter;
