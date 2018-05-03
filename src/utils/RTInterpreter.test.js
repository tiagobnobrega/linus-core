import RTInterpreter, { RTInterpreterError } from './RTInterpreter';

describe('RTInterpreter', () => {
  test('Should be able in define empty scope interptreter', () => {
    expect(() => RTInterpreter()).not.toThrow();
  });

  test('Should require correclty if valid code is passed', () => {
    const interpreter = RTInterpreter({});
    expect(interpreter.require(`()=>'foo'`)()).toBe('foo');
  });

  test('Should throw if NOT valid code is passed', () => {
    const interpreter = RTInterpreter({});
    expect(() => interpreter.require(`()>'foo'`)).toThrow(RTInterpreterError);
  });

  test('Should throw if NOT string code is passed', () => {
    const interpreter = RTInterpreter({});
    expect(() => interpreter.require(25)).toThrow(RTInterpreterError);
  });

  test('Should make variables in sandbox accessible', () => {
    const foo = 'bar';
    const interpreter = RTInterpreter({ foo });
    expect(interpreter.require(`()=>foo`)()).toBe('bar');
  });

  test('Should prevent variables outside sandbox from being accessed', () => {
    const foo = 'bar';
    const interpreter = RTInterpreter({});
    expect(interpreter.require(`()=>foo`)).toThrow();
  });

  test('Should access sandbox shadow variables', () => {
    const foo = 'bar';
    const interpreter = RTInterpreter({ foo: 'sanboxed' });
    expect(interpreter.require(`()=>foo`)()).toBe('sanboxed');
  });

  test('Should pass variables as reference', () => {
    const foo = { bar: 'bar' };
    const interpreter = RTInterpreter({ foo });
    const fn = interpreter.require(`()=>foo.bar='baz'`);
    fn();
    expect(foo.bar).toBe('baz');
  });

  test('Should interpret correclty attributes', () => {
    const target = { attr1: `()=>'foo'`, attr2: `()=>'bar'` };
    const interpreter = RTInterpreter({});
    interpreter.interpretAttributes(target, 'attr1', 'attr2');
    expect(target.attr1()).toBe('foo');
    expect(target.attr2()).toBe('bar');
  });

  test('Should ignore null and undefined attributes', () => {
    const target = { attr1: `()=>'foo'`, attr2: `()=>'bar'` };
    const interpreter = RTInterpreter({});
    expect(() =>
      interpreter.interpretAttributes(target, 'attr1', 'attr2', 'attr3')
    ).not.toThrow();
  });

  test('Should throw if NOT string attribute value is passed', () => {
    const target = { attr1: `()=>'foo'`, attr2: 2 };
    const interpreter = RTInterpreter({});
    expect(() =>
      interpreter.interpretAttributes(target, 'attr1', 'attr2')
    ).toThrow();
  });

});
