const _ = require('lodash');
const vm = require('vm');

const RTCompiler = function(args) {
  const sandbox = vm.createContext(
    _.merge(args, { module: { exports: null } })
  );
  const me = {};

  me.require = function(code) {
    if (!(typeof code === 'string')) {
      throw new Error(`Cannot compile code ${code}. Only strings allowed`);
    }
    sandbox.module.exports = null;
    vm.runInNewContext(code, sandbox);
    return sandbox.module.exports;
  };
  me.compileAttributes = (obj, ...attrs) => {
    attrs.forEach(attr => {
      const attrVal = obj[attr];
      if (!attrVal) return;
      if (!(typeof attr === 'string')) {
        throw new Error(
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

module.exports = RTCompiler;
