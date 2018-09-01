const { DateTime } = require('luxon');
const fetchItem = require('./item');
const createFetch = require('../fetch');
const uploadFile = require('./upload');

jest.mock('node-fetch');
jest.mock('../fetch');
jest.mock('./parent');
jest.mock('./item');
jest.mock('fs');

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


test('upload file', () => {
  const name = 'test.txt';
  const result = uploadFile('/tmp', '1234', 'test.txt', 'abcd', DateTime.local(), 128).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file large', () => {
  const name = 'test.txt';
  const result = uploadFile('/tmp', '1234', name, 'abcd', DateTime.local(), 104857600).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file large file subdirectory', () => {
  const name = 'test/test.txt';
  const result = uploadFile('/tmp', '1234', name, 'abcd', DateTime.local(), 104857600).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file that has a matching hash', () => {
  const hash = 'abcd';
  json.mockResolvedValueOnce({
    file: {
      hashes: {
        sha1Hash: hash,
      },
    },
  });
  const result = uploadFile('/tmp', '1234', 'test.txt', hash, DateTime.local(), 128).toPromise();

  return expect(result).resolves.toBeUndefined();
});

test('upload file that does not yet exist', () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json,
  });

  const name = 'test.txt';
  const result = uploadFile('/tmp', '1234', 'test.txt', 'abcd', DateTime.local(), 128).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file that fails to retrieve stats', () => {
  const name = 'test.txt';
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${name}`;
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url,
    json,
  };
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;

  const result = uploadFile('/tmp', '1234', 'test.txt', 'abcd', DateTime.local(), 128).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('upload file that fails to retrieve upload url', () => {
  const name = 'test.txt';
  const url = `https://graph.microsoft.com/v1.0/me/drive/items/root:/${name}:/createUploadSession`;
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url,
    json,
  };
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;

  const result = uploadFile('/tmp', '1234', name, 'abcd', DateTime.local(), 128).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('upload file that is newer', () => {
  const hash = 'abcd';
  json.mockResolvedValueOnce({
    lastModifiedDateTime: DateTime.local().toISO(),
  });

  const result = uploadFile('/tmp', '1234', 'test.txt', hash, DateTime.local().minus({ days: 1 }), 128).toPromise();

  return expect(result).resolves.toBeUndefined();
});

test('upload file failure', () => {
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url: undefined,
    json,
  };
  const error = new Error(`${data.status} ${data.statusText} ${undefined}`);
  fetch.mockResolvedValueOnce(mockFetchValue)
    .mockResolvedValueOnce(mockFetchValue)
    .mockResolvedValueOnce(data);
  const result = uploadFile('/tmp', '1234', 'test.txt', 'abcd', DateTime.local(), 104857600).toPromise();

  return expect(result).rejects.toEqual(error);
});
