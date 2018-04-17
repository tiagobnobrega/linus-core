module.exports = (attr = 'numbers') => msg =>
  // TODO: use numbers Regex
  ({ [attr]: msg.toUpperCase() });
