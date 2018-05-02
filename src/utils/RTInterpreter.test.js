import RTInterpreter from './RTInterpreter';

describe('RTInterpreter', () => {
  test('Should be able in define empty scope interptreter', () => {
    expect(() => RTInterpreter({})).not.toThrow();
  });
});
