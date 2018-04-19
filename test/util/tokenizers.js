import { wait, S_TIME } from './helpers';

export const UppercaseTokenizer = ({
  contextAttr = 'uppercaseMessage',
  timeout = S_TIME,
}) => ({
  id: 'UppercaseTokenizer',
  tokenize: async msg => {
    wait(timeout).then(() => ({ [contextAttr]: msg.toUpperCase() }));
  },
});

export const foo = 'bar'; // TODO: REMOVER !!!!
