const { stat } = require('fs');
const readdir = require('recursive-readdir');
const cleanTrash = require('./clean');

jest.mock('fs');
jest.mock('graceful-fs', () => jest.mock('fs'));
jest.mock('fs-extra');
jest.mock('recursive-readdir');

const mockReaddir = jest.fn().mockResolvedValue([]);
readdir.mockImplementation(mockReaddir);

const mockStats = jest.fn().mockResolvedValue({});
stat.mockImplementation((path, options, callback) => {
  if (typeof options === 'function') {
    return options(undefined, mockStats());
  }

  return callback(undefined, mockStats());
});

test('clean trash', () => {
  const clean = cleanTrash('/data').toPromise();

  return expect(clean).resolves.toEqual({
    action: 'trash',
    phase: 'end',
  });
});

test('clean trash with new file', () => {
  mockReaddir.mockResolvedValueOnce([
    '/data/test.txt',
  ]);
  mockStats.mockResolvedValueOnce({
    mtime: new Date(),
  });
  const clean = cleanTrash('/data').toPromise();

  return expect(clean).resolves.toEqual({
    action: 'trash',
    phase: 'end',
  });
});

test('clean trash with old file', () => {
  mockReaddir.mockResolvedValueOnce([
    '/data/test.txt',
  ]);
  mockStats.mockResolvedValueOnce({
    mtime: new Date('1995-12-17T03:24:00'),
  });
  const clean = cleanTrash('/data').toPromise();

  return expect(clean).resolves.toEqual({
    action: 'trash',
    phase: 'end',
  });
});

test('clean trash with error file', () => {
  mockReaddir.mockResolvedValueOnce([
    '/data/test.txt',
  ]);
  mockStats.mockRejectedValueOnce(new Error());
  const clean = cleanTrash('/data').toPromise();

  return expect(clean).resolves.toEqual({
    action: 'trash',
    phase: 'end',
  });
});
