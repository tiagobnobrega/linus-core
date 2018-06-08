import extendError from './extendError';

class CustomError extends extendError() {}
class CustomSubError extends extendError(CustomError) {}
class OtherError extends extendError(){}
class OtherSubError extends extendError(){}

describe('RTInterpreter', () => {
  const customErr = new CustomError('custom');
  const customSub = new CustomSubError('subcustom!');
  const otherErr = new OtherError('other');
  const otherSubErr = new OtherSubError('otherSub');

  test('Should be instance of CustomError', () => {
    expect(customErr instanceof CustomError).toBe(true);
  });

  test('Should be instance of Error', () => {
    expect(customErr instanceof Error).toBe(true);
  });

  test('Sub-class should be instance of Error', () => {
    expect(customSub instanceof Error).toBe(true);
  });

  test('Sub-class should be instance of CustomError', () => {
    expect(customSub instanceof CustomError).toBe(true);
  });

  test('Sub-class should be instance of CustomSubError', () => {
    expect(customSub instanceof CustomSubError).toBe(true);
  });

  test('Other should NOT be instance of CustomSubError', () => {
    expect(otherErr instanceof CustomError).toBe(false);
  });

  test('OtherSub should NOT be instance of CustomSubError', () => {
    expect(otherSubErr instanceof CustomError).toBe(false);
  });
});
