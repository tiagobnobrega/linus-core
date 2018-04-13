const fetch = require('node-fetch');

class Dialog {
  static getAll() {
    const url =
      process.env.LAIS_ADM_GET_DIALOGS_URL +
      '?botId=' +
      process.env.LAIS_CORE_BOT_NAME;

    return fetch(url, {
      method: 'GET',
      headers: { Authorization: process.env.LAIS_ADM_TOKEN },
    }).then(response => {
      return response.json();
    });
  }
}

module.exports = Dialog;
