const { DateTime } = require('luxon');
const copyUploadFile = require('./copy-upload');
const copy = require('./copy');
const upload = require('./upload');
const createFetch = require('../fetch');
const fetchItem = require('./item');

jest.mock('./copy');
jest.mock('./upload');
jest.mock('../fetch');
jest.mock('./item');

copy.mockResolvedValue(true);
upload.mockResolvedValue(false);

const mockJsonValue = {};

const json = jest.fn()
  .mockResolvedValue(mockJsonValue);

const mockFetchValue = {
  ok: true,
  json,
};

const fetch = jest.fn()
  .mockResolvedValue(mockFetchValue);

createFetch.mockResolvedValue(fetch);
fetchItem.mockImplementation(fetch);

test('copy upload file', () => {
  const result = copyUploadFile('/tmp', '1234', 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('copy upload file from not found', () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json,
  });
  const result = copyUploadFile('/tmp', '1234', 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('copy upload file from error', () => {
  const data = {
    ok: false,
    status: 400,
    statusText: 'ERROR',
    url: 'https://example.com',
    json,
  };
  fetch.mockResolvedValueOnce(data);

  const error = new Error(`${data.status} ${data.statusText} ${data.url}`);
  error.data = data;

  const result = copyUploadFile('/tmp', '1234', 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});

test('copy upload file to not found', () => {
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json,
  });
  const result = copyUploadFile('/tmp', '1234', 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('copy upload file from error', () => {
  fetch.mockResolvedValueOnce(mockFetchValue);
  const data = {
    ok: false,
    status: 400,
    statusText: 'ERROR',
    url: 'https://example.com',
    json,
  };
  fetch.mockResolvedValueOnce(data);

  const error = new Error(`${data.status} ${data.statusText} ${data.url}`);
  error.data = data;

  const result = copyUploadFile('/tmp', '1234', 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});

test('copy upload file has same hash as filesystem', () => {
  const hash = 'abcd';
  json.mockResolvedValueOnce({
    file: {
      hashes: {
        sha1Hash: hash,
      },
    },
  });
  const result = copyUploadFile('/tmp', '1234', 'test2.txt', hash, DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('copy upload file unnecessary copy', () => {
  const hash = 'abcd';
  const data = {
    file: {
      hashes: {
        sha1Hash: hash,
      },
    },
  };
  json.mockResolvedValueOnce(data);
  json.mockResolvedValueOnce(data);
  const result = copyUploadFile('/tmp', '1234', 'test2.txt', hash, DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeUndefined();
});
