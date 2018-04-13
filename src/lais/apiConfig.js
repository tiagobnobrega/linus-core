require('dotenv').config();
var errs = require('restify-errors');

const apiHeadersDependenciesValidValues = {
  authorization: process.env.LAIS_BOT_AUTHORIZATION,
};

const apiRoutesHeaderDependecies = {
  '/api/notification': ['authorization'],
};

class apiConfig {
  static requestValidate(headers, path, next) {
    let route = path,
      headersValidationFeedback = {};

    if (this.routeNeedValidate(route)) {
      headersValidationFeedback = this.allHeadersValidation(route, headers);
    }
    return this.nextRequestAction(headersValidationFeedback, next);
  }

  static routeNeedValidate(route) {
    return this.routesHeaderDependecies.hasOwnProperty(route);
  }

  static allHeadersValidation(route, headers) {
    let feedback = {
      message: '',
      errors: 0,
    };

    this.routesHeaderDependecies[route].forEach(currentHeader => {
      let spacer = feedback.message == '' ? '' : ' ; ',
        hasHeaderErrorMessage = this.headerErrorMessage(
          this.headersDependenciesValidValues,
          headers,
          currentHeader,
          spacer
        );

      feedback.message += hasHeaderErrorMessage ? hasHeaderErrorMessage : ``;
      feedback.errors += hasHeaderErrorMessage ? 1 : 0;
    });

    return feedback;
  }

  static get headersDependenciesValidValues() {
    return apiHeadersDependenciesValidValues;
  }

  static get routesHeaderDependecies() {
    return apiRoutesHeaderDependecies;
  }

  static headerErrorMessage(
    headersDependenciesValidValues,
    headers,
    header,
    spacer
  ) {
    let reqCondition =
      headersDependenciesValidValues[header] === headers[header];
    return reqCondition
      ? false
      : `${spacer}header ${header} inválido ou inexistente`;
  }

  static nextRequestAction(headersValidationFeedback, next) {
    return headersValidationFeedback.errors > 0
      ? next(
          new errs.UnauthorizedError({
            code: '401',
            message: headersValidationFeedback.message,
          })
        )
      : next();
  }
}

module.exports = apiConfig;
