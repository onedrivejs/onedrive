const { DateTime } = require('luxon');
const { stat, utimes } = require('fs');
const { fromFile: hashFromFile } = require('hasha');
const fetch = require('node-fetch');
const { Readable } = require('stream');
const promisePipe = require('promisepipe');
const { shouldDownloadFile, downloadFile } = require('./download');

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

test('should download file', () => {
  const result = shouldDownloadFile('/data', 'test.txt', '1234', DateTime.local());

  return expect(result).resolves.toBeTruthy();
});

test('should download file with identical hash', () => {
  hashFromFile.mockResolvedValueOnce('1234');
  const result = shouldDownloadFile('/data', 'test.txt', '1234', DateTime.local());

  return expect(result).resolves.toBeFalsy();
});

test('should download file that is newer', () => {
  mockStats.mockResolvedValueOnce({
    mtime: new Date(),
  });
  const result = shouldDownloadFile('/data', 'test.txt', '1234', DateTime.local().minus({ days: 1 }));

  return expect(result).resolves.toBeFalsy();
});

test('should download file that does not exist', () => {
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);
  const result = shouldDownloadFile('/data', 'test.txt', '1234', DateTime.local());

  return expect(result).resolves.toBeTruthy();
});

test('should download file that throws an error', () => {
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);
  const result = shouldDownloadFile('/data', 'test.txt', '1234', DateTime.local());

  return expect(result).rejects.toEqual(error);
});

test('download file', () => {
  const name = 'test.txt';
  const result = downloadFile('/data', name, DateTime.local(), 'https://example.com');

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
    statusText: 'Not Found',
  };
  fetch.mockResolvedValueOnce(response);
  const error = new Error(`${response.status} ${response.statusText} ${downloadUrl}`);
  const name = 'test.txt';
  const result = downloadFile('/data', name, DateTime.local(), downloadUrl);

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
  const result = downloadFile('/data', name, DateTime.local(), 'https://example.com');

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
  const result = downloadFile('/data', name, DateTime.local(), 'https://example.com');

  return expect(result).rejects.toEqual(error);
});
