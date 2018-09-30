const { DateTime } = require('luxon');
const moveUpload = require('./move-upload');
const createFolder = require('./create');
const move = require('./move');
const remove = require('./remove');
const upload = require('./upload');
const getParent = require('./parent');
const createFetch = require('../fetch');
const fetchItem = require('./item');

jest.mock('./move');
jest.mock('./upload');
jest.mock('./remove');
jest.mock('./create');
jest.mock('../fetch');
jest.mock('./item');
jest.mock('./parent');

const mockParent = {
  id: '123',
  driveId: 'abc',
};

move.mockResolvedValue(true);
createFolder.mockResolvedValue(false);
upload.mockResolvedValue(false);
remove.mockResolvedValue(false);
getParent.mockResolvedValue(mockParent);

const mockJsonValue = {
  parentReference: {
    driveId: 'abc',
  },
};

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

test('move upload', () => {
  const type = 'file';
  const result = moveUpload('1234', type, 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move upload folder', () => {
  const type = 'folder';
  const result = moveUpload('1234', type, 'test2', null, DateTime.local(), 128, 'test').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('move upload from not found', () => {
  const type = 'file';
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json,
  });
  const result = moveUpload('1234', type, 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move upload folder from not found', () => {
  const type = 'folder';
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json,
  });
  const result = moveUpload('1234', type, 'test2', '', DateTime.local(), 128, 'test').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move upload from error', () => {
  const type = 'file';
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

  const result = moveUpload('1234', type, 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});

test('move upload to not found', () => {
  const type = 'file';
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json,
  });
  const result = moveUpload('1234', type, 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});

test('move upload from error', () => {
  const type = 'file';
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

  const result = moveUpload('1234', type, 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).rejects.toEqual(error);
});

test('move upload item has same hash as filesystem', () => {
  const type = 'file';
  const hash = 'abcd';
  json.mockResolvedValueOnce({
    file: {
      hashes: {
        sha1Hash: hash,
      },
    },
    parentReference: {
      driveId: 'abcd',
    },
  });
  const result = moveUpload('1234', type, 'test2.txt', hash, DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move upload unnecessary move', () => {
  const type = 'file';
  const hash = 'abcd';
  const data = {
    file: {
      hashes: {
        sha1Hash: hash,
      },
    },
    parentReference: {
      driveId: 'abcd',
    },
  };
  json.mockResolvedValueOnce(data);
  json.mockResolvedValueOnce(data);
  const result = moveUpload('1234', type, 'test2.txt', hash, DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move upload accross shared drives', () => {
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce({
    ...mockFetchValue,
    ok: false,
    status: 404,
  });
  getParent.mockResolvedValueOnce({
    ...mockParent,
    driveId: 'def',
  });
  const result = moveUpload('1234', 'file', 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeFalsy();
});

test('move upload safe to move', () => {
  json.mockResolvedValueOnce({
    ...mockJsonValue,
    file: {
      hashes: {
        sha1Hash: 'abcd',
      },
    },
  });
  json.mockResolvedValueOnce({
    ...mockJsonValue,
    file: {
      hashes: {
        sha1Hash: 'efgh',
      },
    },
  });

  const result = moveUpload('1234', 'file', 'test2.txt', 'abcd', DateTime.local(), 128, 'test.txt').toPromise();

  return expect(result).resolves.toBeTruthy();
});
