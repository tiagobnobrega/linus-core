const _ = require('lodash');
const get = (p, o) =>
  p
    .split('.')
    .reduce((xs, x) => (xs && typeof xs[x] !== 'undefined' ? xs[x] : null), o);
const add = (p, o) => (get(p) || 0) + 1;
const clear = (o, ...p) => {
  let clone = _.cloneDeep(o);
  p.forEach(e => {
    delete clone[e];
  });
  return clone;
};
const clearAll = () => {
  return {};
};

module.exports = { get, add, clear, clearAll };
