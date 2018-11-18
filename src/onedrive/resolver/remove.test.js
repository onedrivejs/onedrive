const fetchItem = require('./item');
const createFetch = require('../fetch');
const remove = require('./remove');

jest.mock('./item');
jest.mock('../fetch');
jest.mock('../../separator', () => () => jest.fn(stream => stream));

const mockJsonValue = {
  id: '123',
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

test('remove file', () => {
  const name = 'test.txt';
  const type = 'file';
  const result = remove('abcd', type, name).toPromise();

  return expect(result).resolves.toEqual({
    action: 'remove',
    phase: 'end',
    type,
    name,
  });
});

test('remove file no longer exists', () => {
  const name = 'test.txt';
  const type = 'file';
  const data = {
    ok: false,
    status: 404,
    statusText: 'NOT FOUND',
    url: 'https://example.com',
    json,
  };
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${data.url}`);
  const result = remove('abcd', type, name).toPromise();

  return expect(result).resolves.toEqual({
    action: 'remove',
    phase: 'error',
    type,
    name,
    error,
  });
});

test('remove file info error', () => {
  const name = 'test.txt';
  const type = 'file';
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url: 'https://example.com',
    json,
  };
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${data.url}`);
  const result = remove('abcd', type, name).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('remove file no longer exists on delete', () => {
  const name = 'test.txt';
  const type = 'file';
  const data = {
    ok: false,
    status: 404,
    statusText: 'NOT FOUND',
    url: 'https://example.com',
    json,
  };
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${data.url}`);
  const result = remove('abcd', type, name).toPromise();

  return expect(result).resolves.toEqual({
    action: 'remove',
    phase: 'error',
    type,
    name,
    error,
  });
});

test('remove file info error on delete', () => {
  const name = 'test.txt';
  const type = 'file';
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url: 'https://example.com',
    json,
  };
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${data.url}`);
  const result = remove('abcd', type, name).toPromise();

  return expect(result).rejects.toEqual(error);
});
