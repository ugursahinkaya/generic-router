import { GenericRouter } from './index.js';
const operations = {
  example: () => {
    console.log('this example fn');
  },
  test: (payload: { firstName: string; lastName: string }) => {
    if (!payload) {
      throw new Error('payload must be provided');
    }
    if (payload.firstName === payload.lastName) {
      return { error: 'Why firstName=lastName?' };
    }
    return payload;
  },
  add: (payload: [number, number]) => {
    if (!payload) {
      throw new Error('payload must be provided');
    }
    return payload[0] + payload[1];
  }
};
const router = new GenericRouter(operations);
await router.call('example');
const res = await router.call('add', [1, 3]);
console.log(res);
const res2 = await router.call('test', { firstName: '123', lastName: '532' });
console.log(res2);
const res3 = await router.call('test', { firstName: '123', lastName: '123' });
console.log(res3);
const res4 = await router.call('test');
console.log(res4);
