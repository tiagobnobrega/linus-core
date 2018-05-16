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

const LinusDialogBase = require('./lib/LinusDialogBase').default;

console.log(LinusDialogBase);
const linus = new LinusDialogBase();

const steps = [
  { feedback: () => 1 },
  { feedback: { type: 'test' } },
  { feedback: () => 2 },
];

return linus.runAction({ steps }).then(feedbacks => {
  console.log('DONE!!!!!');
  console.log('feedbacks:', feedbacks);
});

// const cadidates = [
//   {
//     condition: () => {
//       a.invalidMethod();
//     },
//   },
// ];
// linus.getCandidates();
