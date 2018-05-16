/**
 * Error subclassing is still not well supported on browsers and not well handled by babel v6 (It should be fixed on 7 version, maybe).
 * This is a approximation approach to that.
 * It can be used to test instanceOf parent classes on catch statements.
 * @param {Class} cls - Class to extend
 * @return {ExtendableBuiltin}
 */
const extendError = (cls = Error) => {
  function ExtendableBuiltin(message, err, keepOriginalTrace = false) {
    const superInstance = Error.call(this, message);
    Object.defineProperty(this, 'name', {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });
    // eslint-disable-next-line no-prototype-builtins
    if (Error.hasOwnProperty('captureStackTrace')) {
      Error.captureStackTrace(this, this.constructor);
    }
    const originalStack =
      err && err.stack && keepOriginalTrace ? `\n\n${superInstance.stack}` : '';
    const cause = err && err.stack ? `\nCaused by: ${err && err.stack}` : '';
    if (err && err.stack) {
      Object.defineProperty(this, 'stack', {
        configurable: true,
        enumerable: false,
        value: `${message}::${err && err.message}${originalStack}${cause}`,
        writable: true,
      });
    }

    Object.defineProperty(this, 'message', {
      configurable: true,
      enumerable: false,
      value: `${message}:: ${err && err.message}`,
      writable: true,
    });
  }
  ExtendableBuiltin.prototype = Object.create(cls.prototype);
  // Object.setPrototypeOf(ExtendableBuiltin, Error.prototype);
  return ExtendableBuiltin;
};

module.exports = extendError;
