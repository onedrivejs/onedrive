const fetchItem = require('./item');
const createFetch = require('../fetch');
const copy = require('./copy');

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

test('copy file', () => {
  const type = 'file';
  const name = 'test2.txt';
  const fromName = 'test.txt';
  const result = copy('1234', name, fromName).toPromise();

  return expect(result).resolves.toEqual({
    action: 'copy',
    phase: 'end',
    type,
    name,
  });
});

test('copy file subfolder', () => {
  const type = 'file';
  const name = 'test/test2.txt';
  const fromName = 'test.txt';
  const result = copy('1234', name, fromName).toPromise();

  return expect(result).resolves.toEqual({
    action: 'copy',
    phase: 'end',
    type,
    name,
  });
});

test('copy file does not exist', () => {
  const type = 'file';
  const name = 'test2.txt';
  const fromName = 'test.txt';
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${fromName}`;
  const data = {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    url,
    json,
  };
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;
  const result = copy('1234', name, fromName).toPromise();

  return expect(result).resolves.toEqual({
    action: 'copy',
    phase: 'error',
    type,
    name,
    error,
  });
});

test('copy file unkown error', () => {
  const type = 'file';
  const name = 'test2.txt';
  const fromName = 'test.txt';
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${fromName}`;
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
  const result = copy('1234', name, fromName).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('copy file root folder error', () => {
  const type = 'file';
  const name = 'test2.txt';
  const fromName = 'test.txt';
  const url = 'https://graph.microsoft.com/v1.0/me/drive/items/root';
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
  const result = copy('1234', name, fromName).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('copy file error', () => {
  const type = 'file';
  const name = 'test2.txt';
  const fromName = 'test.txt';
  const url = 'https://graph.microsoft.com/v1.0/me/drive/items/undefined';
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
  const result = copy('1234', name, fromName).toPromise();

  return expect(result).rejects.toEqual(error);
});
