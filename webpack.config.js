const path = require('path');

const commonConfig = {
  mode: 'development',
  entry: {
    LinusDialogBase: './src/LinusDialogBase.js',
    LinusDialog: './src/LinusDialog.js',
    tokenizers: './src/tokenizers/index.js',
    handlers: './src/handlers/index.js',
    RTInterpreter: './src/utils/RTInterpreter.js',
    extendError: './src/utils/extendError.js',
  },
  output: {
    path: path.resolve(__dirname, './lib'),
    globalObject: 'this',
    library: '[name]', // ['linus', '[name]'],
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

const nodeConfig = {
  ...commonConfig,
  target: 'node',
  output: {
    ...commonConfig.output,
    filename: '[name].node.js',
    libraryTarget: 'commonjs2',
  },
};

const webConfig = {
  ...commonConfig,
  target: 'web',
  output: {
    ...commonConfig.output,
    filename: '[name].web.js',
    libraryTarget: 'umd',
  },
};
module.exports = [nodeConfig, webConfig];
