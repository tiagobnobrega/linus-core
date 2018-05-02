// const LinusDialog = require('./lib/LinusDialog ')
// const linus = new LinusDialog();
// console.log('Done!!!', linus);

// const RTInterpreter =  require("./lib/RTInterpreter");
//
// const interpreter = RTInterpreter({});

// function ExtendableBuiltin(cls){
//   function ExtendableBuiltin(){
//     cls.apply(this, arguments);
//   }
//   ExtendableBuiltin.prototype = Object.create(cls.prototype);
//   Object.setPrototypeOf(ExtendableBuiltin, cls);
//
//   return ExtendableBuiltin;
// }
const extendError = require('./lib/extendError');

class RTInterpreterError extends extendError() {}

// const ExtendableError = require('./lib/ExtendableError');

// class RTInterpreterError extends ExtendableError {
//   constructor(message) {
//     super(message);
//     // this.name = RTInterpreterError.constructor.name;
//     this.type = 'RTInterpreterError';
//   }
// }

// const err = new ExtendableError('test');
const rtErr = new RTInterpreterError('custom message');

try {
  console.log(`rtErr.name: ${rtErr.name}`);
  console.log(`rtErr.constructor.name: ${rtErr.constructor.name}`);
  throw rtErr;
} catch (e) {
  console.log(
    `rtErr instanceOf RTInterpreterError==${e instanceof RTInterpreterError}`
  );
  console.log(`rtErr instanceOf Error==${e instanceof Error}`);
}

throw rtErr;