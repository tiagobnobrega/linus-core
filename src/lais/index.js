let version = '1.0b';
let _client = require('./Client');
let _dictionary = require('./Dictionary');
let _laisDialog = require('./LaisDialog');
let _laisDialogRemote = require('./LaisDialogRemote');
let _context = require('./models/context');
module.exports = {
  Client: _client.Client,
  Dictionary: _dictionary.Dictionary,
  Dialog: _laisDialog,
  DialogRemote: _laisDialogRemote,
  Context: _context,
  version,
};
