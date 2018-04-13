const fetch = require('node-fetch');
const fetchUtils = require('./fetchUtils');

const laisClient = function(initArgs) {
  let endPointUrl = process.env.LAIS_CORE_FALA_API_URL;
  let connectorId = process.env.LAIS_CORE_CONNECTOR_ID;
  let me = {};

  /*
     *   Retorna uma promisse com o resultado da chamada
     */
  me.talk = function talk(userId, message) {
    return fetch(endPointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AppName: process.env.LAIS_CORE_APP_NAME,
        Authorization: process.env.LAIS_CORE_AUTHORIZATION,
      },
      body: JSON.stringify({
        connectorId: connectorId,
        contextId: userId,
        userId: userId,
        inputText: message.toString(),
      }),
    }).then(fetchUtils.handleEnvelope);
  };

  let init = function init() {
    loadArgs();
  };

  let loadArgs = function loadArgs() {
    initArgs = initArgs || {};
    endPointUrl = initArgs.url || endPointUrl;
    connectorId = initArgs.connector || connectorId;

    if (!endPointUrl) {
      throw new Error(
        'Não foi possível determinar o valor para url. Por favor verifique a variável de ambiente LAIS_CORE_FALA_API_URL ou os parâmetros passados para o cliente.'
      );
    }
    if (!connectorId) {
      throw new Error(
        'Não foi possível determinar o valor para url. Por favor verifique a variável de ambiente LAIS_CORE_CONNECTOR_ID ou os parâmetros passados para o cliente.'
      );
    }
  };

  init();
  return me;
};

module.exports = {
  Client: laisClient,
};
