const Mustache = require('mustache');
const chance = require('chance')();
const _ = require('lodash');

const DictionaryTemplate = function(dictionaryDefinition) {
  let me = {};
  let _dictionary = {};

  let buildViewFromDictionary = function(dic) {
    if (!dic) return {};
    let vw = {};
    let dicVal, vwVal;
    let ctx = { vw: vw };
    for (key in dic) {
      dicVal = dic[key];
      vwVal = dicVal;
      vwVal = buildViewElement.call(ctx, dicVal);
      vw[key] = vwVal;
    }
    return vw;
  };

  let buildViewElement = function(dicVal) {
    let vwVal = dicVal;
    let vw = this.vw;
    if (Array.isArray(dicVal)) {
      vwVal = function() {
        return Mustache.render(chance.pickone(dicVal), vw);
        //console.log('evaluated:',dicVal,"into:",ret);
        // return ret
      };
    } else if (typeof dicVal === 'string' || dicVal instanceof String) {
      vwVal = function() {
        return Mustache.render(dicVal, vw);
        //console.log('evaluated:',dicVal,"into:",ret);
        // return ret
      };
    } else if (dicVal && {}.toString.call(dicVal) === '[object Function]') {
      vwVal = function() {
        return Mustache.render(dicVal(vw), vw);
        //console.log('evaluated:',dicVal,"into:",ret);
        // return ret
      };
    }
    return vwVal;
  };

  let init = function() {
    _dictionary = buildViewFromDictionary(dictionaryDefinition);
  };

  me.addDefinitions = function(newDefinitions) {
    Object.assign(_dictionary, buildViewFromDictionary(newDefinitions));
  };

  me.resolve = function(srcTemplate) {
    console.log('Resolving Template:' + srcTemplate);
    let ret = Mustache.render(srcTemplate, _dictionary);
    console.log('Resolved To:' + ret);
    return ret;
  };

  me.resolveWithContext = function(srcTemplate, context) {
    let _ctxDictionary = _.merge({}, _dictionary, context);
    return Mustache.render(srcTemplate, _ctxDictionary);
  };

  init();
  return me;
};

module.exports = {
  Dictionary: DictionaryTemplate,
};
