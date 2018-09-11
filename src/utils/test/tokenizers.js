import { wait, S_TIME } from './helpers';

export const validTokenizer = (id = 'validTokenizer') => ({
  id,
  tokenize: () => {},
});

export const testTokenizer = (id = 'testTokenizer', waitTime = 50) => ({
  id,
  tokenize: msg =>
    wait(waitTime).then(() => ({
      [id]: msg,
      [`${id}_timestamp`]: new Date().getTime(),
    })),
});

export const UppercaseTokenizer = ({
  contextAttr = 'uppercaseMessage',
  timeout = S_TIME,
}) => ({
  id: 'UppercaseTokenizer',
  tokenize: async msg => {
    wait(timeout).then(() => ({ [contextAttr]: msg.toUpperCase() }));
  },
});
