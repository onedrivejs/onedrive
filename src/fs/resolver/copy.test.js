const { fromFile: hashFromFile } = require('hasha');
const { copy } = require('fs-extra');
const { shouldCopyFile, copyFile } = require('./copy');

jest.mock('hasha');
jest.mock('fs-extra');


test('should copy file', () => {
  const result = shouldCopyFile('/data', 'test.txt', '1234');

  return expect(result).resolves.toBeFalsy();
});

test('should copy file with identical hash', () => {
  const hash = '1234';
  hashFromFile.mockResolvedValueOnce(hash);

  const result = shouldCopyFile('/data', 'test.txt', hash);

  return expect(result).resolves.toBeTruthy();
});

test('should copy file with non-matching hash', () => {
  hashFromFile.mockResolvedValueOnce('1234');

  const result = shouldCopyFile('/data', 'test.txt', '4321');

  return expect(result).resolves.toBeFalsy();
});

test('should copy file that does not exist.', () => {
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);

  const result = shouldCopyFile('/data', 'test.txt', '1234');

  return expect(result).resolves.toBeFalsy();
});

test('should copy file that cannot be read for some reason', () => {
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);

  const result = shouldCopyFile('/data', 'test.txt', '1234');

  return expect(result).rejects.toEqual(error);
});

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
