const { DateTime } = require('luxon');
const { stat, utimes } = require('fs');
const { fromFile: hashFromFile } = require('hasha');
const fetch = require('node-fetch');
const { Readable } = require('stream');
const promisePipe = require('promisepipe');
const downloadFile = require('./download');

jest.mock('fs');
jest.mock('graceful-fs', () => jest.mock('fs'));
jest.mock('fs-extra');
jest.mock('hasha');
jest.mock('node-fetch');
jest.mock('promisepipe');
jest.mock('stream');

hashFromFile.mockResolvedValue('');

const mockStats = jest.fn().mockResolvedValue({});
stat.mockImplementation((path, options, callback) => {
  if (typeof options === 'function') {
    return options(undefined, mockStats());
  }

  return callback(undefined, mockStats());
});
utimes.mockImplementation((path, atime, mtime, callback) => callback(undefined));

fetch.mockResolvedValue({
  ok: true,
  body: new Readable(),
});

test('should download file with identical hash', () => {
  hashFromFile.mockResolvedValueOnce('1234');
  const result = downloadFile('/data', 'test.txt', '1234', DateTime.local()).toPromise();

  return expect(result).resolves.toEqual(undefined);
});

test('should download file that is newer', () => {
  const name = 'test.txt';
  mockStats.mockResolvedValueOnce({
    mtime: new Date(),
  });
  const result = downloadFile('/data', name, '1234', DateTime.local().minus({ days: 1 })).toPromise();

  return expect(result).resolves.toEqual(undefined);
});

test('should download file that does not exist', () => {
  const name = 'test.txt';
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);
  const result = downloadFile('/data', name, '1234', DateTime.local()).toPromise();

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('should download file that throws an error', () => {
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);
  const result = downloadFile('/data', 'test.txt', '1234', DateTime.local()).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('download file', () => {
  const name = 'test.txt';
  const result = downloadFile('/data', name, 'abcd', DateTime.local(), 'https://example.com').toPromise();

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('download file bad response', () => {
  const downloadUrl = 'https://example.com';
  const response = {
    ok: false,
    status: 404,
    url: downloadUrl,
    statusText: 'Not Found',
  };
  fetch.mockResolvedValueOnce(response);
  const error = new Error(`${response.status} ${response.statusText} ${downloadUrl}`);
  const name = 'test.txt';
  const result = downloadFile('/data', name, 'abcd', DateTime.local(), downloadUrl).toPromise();

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'error',
    type: 'file',
    name,
    error,
  });
});

test('download file will override', () => {
  const error = new Error();
  error.originalError = new Error();
  error.originalError.code = 'EEXIST';
  promisePipe.mockRejectedValueOnce(error);
  const name = 'test.txt';
  const result = downloadFile('/data', name, 'abcd', DateTime.local(), 'https://example.com').toPromise();

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('download file will throw error', () => {
  const error = new Error();
  promisePipe.mockRejectedValueOnce(error);
  const name = 'test.txt';
  const result = downloadFile('/data', name, 'abcd', DateTime.local(), 'https://example.com').toPromise();

  return expect(result).rejects.toEqual(error);
});
