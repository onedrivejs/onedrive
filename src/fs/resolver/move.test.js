const { move } = require('fs-extra');
const moveFile = require('./move');

jest.mock('fs');
jest.mock('graceful-fs', () => jest.mock('fs'));
jest.mock('fs-extra');

test('move file', () => {
  const name = 'test2.txt';
  const result = moveFile('/data', name, 'test2.txt');

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('move file that no longer exists', () => {
  const error = new Error();
  error.code = 'ENOENT';
  move.mockRejectedValueOnce(error);
  const name = 'test2.txt';
  const result = moveFile('/data', name, 'test2.txt');

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'error',
    type: 'file',
    name,
    error,
  });
});

test('move file that will be overwritten', () => {
  const error = new Error();
  move.mockRejectedValueOnce(error);
  const name = 'test2.txt';
  const result = moveFile('/data', name, 'test2.txt');

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('move file that will be overwritten then errors', () => {
  const error = new Error();
  move.mockRejectedValueOnce(error);

  const error2 = new Error();
  error2.code = 'ENOENT';
  move.mockRejectedValueOnce(error2);
  const name = 'test2.txt';
  const result = moveFile('/data', name, 'test2.txt');

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'error',
    type: 'file',
    name,
    error: error2,
  });
});

test('move file that will error out', () => {
  const error = new Error();
  move.mockRejectedValueOnce(error);
  move.mockRejectedValueOnce(error);
  const name = 'test2.txt';
  const result = moveFile('/data', name, 'test2.txt');

  return expect(result).rejects.toEqual(error);
});
