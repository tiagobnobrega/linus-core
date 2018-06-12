const path = require('path');
const splitConfigs = require('./webpack.config');

const unifiedConfigOverride = (baseCfg, filename) => ({
  ...baseCfg,
  entry: './src/index.js',
  output: {
    ...baseCfg.output,
    path: path.resolve(__dirname, './lib'),
    filename,
    library: 'linus',
  },
});

module.exports = [
  {
    ...unifiedConfigOverride(splitConfigs[0], 'linus.node.js'),
  },
  {
    ...unifiedConfigOverride(splitConfigs[1], 'linus.web.js'),
  },
];
