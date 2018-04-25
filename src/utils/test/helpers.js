export const wait = (delay, ...values) =>
  new Promise(resolve => setTimeout(resolve, delay, ...values));

export const S_TIME = 1000;
export const M_TIME = 3000;
export const L_TIME = 5000;
export const XL_TIME = 7000;
export const XXL_TIME = 10000;