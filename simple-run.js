// const extendError = require('./lib/extendError');

// class RTInterpreterError extends extendError() {}
// const rtErr = new RTInterpreterError('custom message');
//
// try {
//   console.log(`rtErr.name: ${rtErr.name}`);
//   console.log(`rtErr.constructor.name: ${rtErr.constructor.name}`);
//   throw rtErr;
// } catch (e) {
//   console.log(
//     `rtErr instanceOf RTInterpreterError==${e instanceof RTInterpreterError}`
//   );
//   console.log(`rtErr instanceOf Error==${e instanceof Error}`);
// }
//
// throw rtErr;

// const LinusDialog = require('./src/LinusDialogBase');
//
// const linus = new LinusDialog();
// const cadidates = [
//   {
//     condition: () => {
//       a.invalidMethod();
//     },
//   },
// ];
// linus.getCandidates();
