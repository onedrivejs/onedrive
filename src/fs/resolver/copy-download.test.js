const { fromFile: hashFromFile } = require('hasha');
const { DateTime } = require('luxon');
const copyDownloadFile = require('./copy-download');
const copy = require('./copy');
const download = require('./download');

jest.mock('hasha');
jest.mock('fs-extra');
jest.mock('./copy');
jest.mock('./download');

copy.mockResolvedValue(true);
download.mockResolvedValue(false);
hashFromFile.mockResolvedValue(undefined);

test('copy download file', () => {
  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('copy download file with identical hash', () => {
  const hash = '1234';
  hashFromFile.mockResolvedValueOnce(hash);

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), hash, 'testOld.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('copy download file with non-matching hash', () => {
  hashFromFile.mockResolvedValueOnce('1234');

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('copy download file uneccessary copy', () => {
  hashFromFile.mockResolvedValueOnce('4321');
  hashFromFile.mockResolvedValueOnce('4321');

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('copy download file no override', () => {
  hashFromFile.mockResolvedValueOnce('4321');
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('copy download file no override throws error', () => {
  hashFromFile.mockResolvedValueOnce('4321');
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});

test('copy download file that does not exist.', () => {
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('copy download file that cannot be read for some reason', () => {
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});
