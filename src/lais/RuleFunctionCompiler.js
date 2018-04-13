const util = require('util');
const _ = require('lodash');
const moment = require('moment');
const { get, add, clear, clearAll } = require('./util/rules-function-utils'); //TODO Remover funções e avaliar impacto
const RTCompiler = require('./util/RTCompiler')({
  get,
  add,
  clear,
  clearAll,
  util,
  _,
  moment,
  console,
  JSON,
});

class RuleFunctionCompiler {
  static compile(rules) {
    const compiledRules = rules.map(rule => {
      RTCompiler.compileAttributes(rule, 'match');

      rule.actions.forEach((action, i) => {
        // Não tem como saber se o goToDialog é uma string com o id do dialogo ou uma string com uma função.
        RTCompiler.compileAttributes(
          action,
          'match',
          'setContext' /*,"goToDialog"*/
        );

        action.replies
          .filter(reply => reply.type === 'function')
          .forEach(functionReply => {
            RTCompiler.compileAttributes(functionReply, 'content');
          });
      });

      return rule;
    });

    return compiledRules;
  }
}

module.exports = RuleFunctionCompiler;
