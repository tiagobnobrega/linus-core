// dispara erros HTTP e extrai dados do envelope
const _handleEnvelope = response => {
  responseParsedPromisse = _handleError(response);
  return _extractData(responseParsedPromisse);
};

//dispara erros HTTP
const _handleError = response => {
  if (!response.ok) {
    return response.json().then(envelope => {
      envelope = envelope || {};
      envelope.error = envelope.error || {};
      envelope.error.status = response.status;
      envelope.error.response = response;
      throw new FetchRequestError(
        'Error (' + response.status + ') requesting:' + response.url,
        envelope.error
      );
    }); //.then(()=> response);
  }
  return response.json();
};

//retorna promise para extração de dados do envelope
const _extractData = responseParsedPromisse => {
  //response.json() returns a Promisse
  return responseParsedPromisse.then(envelope => envelope);
};

class FetchRequestError extends Error {
  constructor(message, err) {
    super(message);
    this.name = 'FetchError';
    Object.assign(this, err);
  }
}

module.exports = {
  handleEnvelope: _handleEnvelope,
  handleError: _handleError,
  extractData: _extractData,
};
// export {_handleEnvelope as handleEnvelope};
// export {_handleError as handleError};
// export {_extractData as extractData};
