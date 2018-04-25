module.exports = function requiredParam(param) {
  const requiredParamError = new Error(
    `Required parameter, "${param}" is missing.`
  );
  // preserve original stack trace (remove requiredParam from it)
  if (typeof Error.captureStackTrace === 'function') {
    Error.captureStackTrace(requiredParamError, requiredParam);
  }
  throw requiredParamError;
};
