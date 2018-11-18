const { of } = require('rxjs');
const createSeparator = require('./separator');

jest.useFakeTimers();

test('stream separator', () => {
  const separator = createSeparator();

  const results = Promise.all([
    separator(of('test')).toPromise().then(v => expect(v).toEqual('test')),
    separator(of('test2')).toPromise().then(v => expect(v).toEqual('test2')),
  ]);

  expect(setInterval).toHaveBeenCalledTimes(1);

  jest.runAllTimers();
  
  return results;
});
