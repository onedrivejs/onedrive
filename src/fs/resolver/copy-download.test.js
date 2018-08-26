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

test('should copy file', () => {
  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('should copy file with identical hash', () => {
  const hash = '1234';
  hashFromFile.mockResolvedValueOnce(hash);

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), hash, 'testOld.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('should copy file with non-matching hash', () => {
  hashFromFile.mockResolvedValueOnce('1234');

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('should copy file that does not exist.', () => {
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('should copy file that cannot be read for some reason', () => {
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);

  const result = copyDownloadFile('/data', 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});
