const { move } = require('fs-extra');
const removeFile = require('./remove');

jest.mock('fs');
jest.mock('graceful-fs', () => jest.mock('fs'));
jest.mock('fs-extra');

test('remove file', () => {
  const name = 'test.txt';
  const result = removeFile('/data', name);

  return expect(result).resolves.toEqual({
    action: 'remove',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('remove file that no longer exists', () => {
  const name = 'test.txt';
  const error = new Error();
  error.code = 'ENOENT';
  move.mockRejectedValueOnce(error);
  const result = removeFile('/data', name);

  return expect(result).resolves.toEqual({
    action: 'remove',
    phase: 'error',
    type: 'file',
    name,
    error,
  });
});

test('remove file that fails for some reason', () => {
  const name = 'test.txt';
  const error = new Error();
  move.mockRejectedValueOnce(error);
  const result = removeFile('/data', name);

  return expect(result).rejects.toEqual(error);
});
