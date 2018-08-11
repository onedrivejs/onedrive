const { stat } = require('fs');
// const { promisify } = require('util');
// const { remove } = require('fs-extra');
const readdir = require('recursive-readdir');
const cleanTrash = require('./clean');

// const writeFile = promisify(fs.writeFile);
// const utimes = promisify(fs.utimes);

jest.mock('fs');
jest.mock('graceful-fs', () => jest.mock('fs'));
jest.mock('fs-extra');
jest.mock('recursive-readdir');

const mockReaddir = jest.fn().mockReturnValue([]);
readdir.mockImplementation(mockReaddir);

const mockStats = jest.fn().mockReturnValue({});
stat.mockImplementation((path, options, callback) => {
  if (typeof options === 'function') {
    return options(undefined, mockStats());
  }

  return callback(undefined, mockStats());
});

test('clean trash', () => {
  const clean = cleanTrash('/data');

  return expect(clean).resolves.toEqual({
    action: 'trash',
    phase: 'end',
  });
});

test('clean trash with new file', () => {
  mockReaddir.mockReturnValueOnce([
    '/data/test.txt',
  ]);
  mockStats.mockReturnValueOnce({
    mtime: new Date(),
  });
  const clean = cleanTrash('/data');

  return expect(clean).resolves.toEqual({
    action: 'trash',
    phase: 'end',
  });
});

test('clean trash with old file', () => {
  mockReaddir.mockReturnValueOnce([
    '/data/test.txt',
  ]);
  mockStats.mockReturnValueOnce({
    mtime: new Date('1995-12-17T03:24:00'),
  });
  const clean = cleanTrash('/data');

  return expect(clean).resolves.toEqual({
    action: 'trash',
    phase: 'end',
  });
});
