const { copy } = require('fs-extra');
const copyFile = require('./copy');

jest.mock('fs-extra');

test('copy file', () => {
  const result = copyFile('/data', 'test.txt', 'test2.txt').toPromise();

  return expect(result).resolves.toEqual({
    action: 'copy',
    phase: 'end',
    type: 'file',
    name: 'test.txt',
  });
});

test('copy file that no longer exists', () => {
  const error = new Error();
  error.code = 'ENOENT';
  copy.mockRejectedValueOnce(error);
  const result = copyFile('/data', 'test.txt', 'test2.txt').toPromise();

  return expect(result).resolves.toEqual({
    action: 'copy',
    phase: 'error',
    type: 'file',
    name: 'test.txt',
    error,
  });
});

test('copy file onto an existing file', () => {
  const error = new Error();
  copy.mockRejectedValueOnce(error);
  const result = copyFile('/data', 'test.txt', 'test2.txt').toPromise();

  return expect(result).resolves.toEqual({
    action: 'copy',
    phase: 'end',
    type: 'file',
    name: 'test.txt',
  });
});

test('copy file onto an error file, that then no longer exists', () => {
  const first = new Error();
  copy.mockRejectedValueOnce(first);
  const second = new Error();
  second.code = 'ENOENT';
  copy.mockRejectedValueOnce(second);
  const result = copyFile('/data', 'test.txt', 'test2.txt').toPromise();

  return expect(result).resolves.toEqual({
    action: 'copy',
    phase: 'error',
    type: 'file',
    name: 'test.txt',
    error: second,
  });
});

test('copy file that errors on multiple counts', () => {
  const error = new Error();
  copy.mockRejectedValueOnce(error);
  copy.mockRejectedValueOnce(error);
  const result = copyFile('/data', 'test.txt', 'test2.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});
