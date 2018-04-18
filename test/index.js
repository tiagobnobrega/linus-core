const LinusDialog = require('../src/LinusDialog');
const _keyBy = require('lodash/keyBy');
const _ = require('lodash');

const testData = require('./testdata');

const linus = LinusDialog({ ...testData });

linus.registe