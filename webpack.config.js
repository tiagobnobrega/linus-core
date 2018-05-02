const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    LinusDialog: './src/LinusDialog.js',
    tokenizers: './src/tokenizers/index.js',
    handlers: './src/handlers/index.js',
    RTInterpreter: './src/utils/RTInterpreter.js',
    extendError: './src/utils/extendError.js',
  },
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: '[name].js',
    libraryTarget: 'umd',
    globalObject: 'this',
    library: ['linus', '[name]'],
  },
  externals: {
    lodash: {
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_',
    },
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules|bower_components)/,
        use: 'babel-loader',
      },
    ],
  },
};
