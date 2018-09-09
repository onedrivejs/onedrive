const { fromFile: hashFromFile } = require('hasha');
const { DateTime } = require('luxon');
const moveDownload = require('./move-download');
const move = require('./move');
const remove = require('./remove');
const download = require('./download');

jest.mock('hasha');
jest.mock('fs-extra');
jest.mock('./move');
jest.mock('./remove');
jest.mock('./download');

move.mockResolvedValue(true);
remove.mockResolvedValue(false);
download.mockResolvedValue(false);
hashFromFile.mockResolvedValue(undefined);

test('move download', () => {
  const type = 'file';
  const result = moveDownload('/data', type, 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move download folder', () => {
  const type = 'folder';
  const result = moveDownload('/data', type, 'test', DateTime.local(), '', 'testOld');

  return expect(result).resolves.toBeTruthy();
});

test('copy download with identical hash', () => {
  const hash = '1234';
  const type = 'file';
  hashFromFile.mockResolvedValueOnce(hash);

  const result = moveDownload('/data', type, 'test.txt', DateTime.local(), hash, 'testOld.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('move download with non-matching hash', () => {
  const type = 'file';
  hashFromFile.mockResolvedValueOnce('1234');

  const result = moveDownload('/data', type, 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move download uneccessary move', () => {
  const type = 'file';
  hashFromFile.mockResolvedValueOnce('4321');
  hashFromFile.mockResolvedValueOnce('4321');

  const result = moveDownload('/data', type, 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move download no override', () => {
  const type = 'file';
  hashFromFile.mockResolvedValueOnce('4321');
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);

  const result = moveDownload('/data', type, 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('move download no override throws error', () => {
  const type = 'file';
  hashFromFile.mockResolvedValueOnce('4321');
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);

  const result = moveDownload('/data', type, 'test.txt', DateTime.local(), '4321', 'testOld.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});

test('move download item that does not exist.', () => {
  const type = 'file';
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);

  const result = moveDownload('/data', type, 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('copy download file that cannot be read for some reason', () => {
  const type = 'file';
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);

  const result = moveDownload('/data', type, 'test.txt', DateTime.local(), '1234', 'testOld.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});
