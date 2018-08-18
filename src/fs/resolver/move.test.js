const { move } = require('fs-extra');
const moveItem = require('./move');

jest.mock('fs');
jest.mock('graceful-fs', () => jest.mock('fs'));
jest.mock('fs-extra');

test('move file', () => {
  const name = 'test2.txt';
  const type = 'file';
  const result = moveItem('/data', type, name, 'test2.txt');

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'end',
    type,
    name,
  });
});

test('move file that no longer exists', () => {
  const error = new Error();
  error.code = 'ENOENT';
  move.mockRejectedValueOnce(error);
  const name = 'test2.txt';
  const type = 'file';
  const result = moveItem('/data', type, name, 'test2.txt');

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'error',
    type,
    name,
    error,
  });
});

test('move file that will be overwritten', () => {
  const error = new Error();
  move.mockRejectedValueOnce(error);
  const name = 'test2.txt';
  const type = 'file';
  const result = moveItem('/data', type, name, 'test2.txt');

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'end',
    type,
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
  const type = 'file';
  const result = moveItem('/data', type, name, 'test2.txt');

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'error',
    type,
    name,
    error: error2,
  });
});

test('move file that will error out', () => {
  const error = new Error();
  move.mockRejectedValueOnce(error);
  move.mockRejectedValueOnce(error);
  const result = moveItem('/data', 'file', 'test2.txt', 'test2.txt');

  return expect(result).rejects.toEqual(error);
});
