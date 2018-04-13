const fetch = require('node-fetch');

class Rule {
  static getAll() {
    const url =
      process.env.LAIS_ADM_GET_RULES_URL +
      '?botId=' +
      process.env.LAIS_CORE_BOT_NAME;

    console.log(`fetching rules @ ${url}`);

    return fetch(url, {
      method: 'GET',
      headers: { Authorization: process.env.LAIS_ADM_TOKEN },
    }).then(response => {
      return response.json();
    });
  }
}

module.exports = Rule;
