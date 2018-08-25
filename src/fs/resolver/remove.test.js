const { move } = require('fs-extra');
const remove = require('./remove');

jest.mock('fs');
jest.mock('graceful-fs', () => jest.mock('fs'));
jest.mock('fs-extra');

test('remove file', () => {
  const name = 'test.txt';
  const type = 'file';
  const result = remove('/data', type, name).toPromise();

  return expect(result).resolves.toEqual({
    action: 'remove',
    phase: 'end',
    type,
    name,
  });
});

test('remove file that no longer exists', () => {
  const name = 'test.txt';
  const type = 'file';
  const error = new Error();
  error.code = 'ENOENT';
  move.mockRejectedValueOnce(error);
  const result = remove('/data', type, name).toPromise();

  return expect(result).resolves.toEqual({
    action: 'remove',
    phase: 'error',
    type,
    name,
    error,
  });
});

test('remove file that fails for some reason', () => {
  const error = new Error();
  move.mockRejectedValueOnce(error);
  const result = remove('/data', 'file', 'test.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});
