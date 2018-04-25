import requiredParam from './requiredParam';

const testFunction = (mandatory = requiredParam('mandatory')) => mandatory;

describe('requiredParams', () => {
  test('Required parameter not passed should throw error', () => {
    expect(() => testFunction()).toThrow();
  });

  test('Required parameter passed should be correctly set', () => {
    const paramValue = new Date().getTime();
    const returned = testFunction(paramValue);
    expect(returned).toBe(paramValue);
  });

  test('requiredParam function should be kept away from stack', () => {
    let errorStack = '';
    try {
      testFunction();
    } catch (e) {
      errorStack = e.stack;
    }
    const indOf = errorStack.indexOf('at requiredParam ');
    expect(indOf).toBe(-1);
  });
});
