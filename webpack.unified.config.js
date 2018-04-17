const path = require('path');
const splitConfig = require('./webpack.config');

const unifiedConfigOverride = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: 'linus.js',
    libraryTarget: 'umd',
    globalObject: 'this',
    library: 'linus',
  },
};

module.exports = {
  ...splitConfig,
  ...unifiedConfigOverride,
};
