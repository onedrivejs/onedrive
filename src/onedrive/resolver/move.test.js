const createFetch = require('../fetch');
const move = require('./move');

jest.mock('node-fetch');
jest.mock('../fetch');
jest.mock('./ensure-dir');
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

test('move file', () => {
  const type = 'file';
  const name = 'test2.txt';
  const oldName = 'test.txt';
  const result = move('1234', type, name, oldName).toPromise();

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'end',
    type,
    name,
  });
});

test('move file subfolder', () => {
  const type = 'file';
  const name = 'test/test2.txt';
  const oldName = 'test.txt';
  const result = move('1234', type, name, oldName).toPromise();

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'end',
    type,
    name,
  });
});

test('move file does not exist', () => {
  const type = 'file';
  const name = 'test2.txt';
  const oldName = 'test.txt';
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${oldName}`;
  const data = {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    json,
  };
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;
  const result = move('1234', type, name, oldName).toPromise();

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'error',
    type,
    name,
    error,
  });
});

test('move file unkown error', () => {
  const type = 'file';
  const name = 'test2.txt';
  const oldName = 'test.txt';
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${oldName}`;
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    json,
  };
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;
  const result = move('1234', type, name, oldName).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('move file root folder error', () => {
  const type = 'file';
  const name = 'test2.txt';
  const oldName = 'test.txt';
  const url = 'https://graph.microsoft.com/v1.0/me/drive/items/root';
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    json,
  };
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;
  const result = move('1234', type, name, oldName).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('move file error', () => {
  const type = 'file';
  const name = 'test2.txt';
  const oldName = 'test.txt';
  const url = 'https://graph.microsoft.com/v1.0/me/drive/items/undefined';
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    json,
  };
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;
  const result = move('1234', type, name, oldName).toPromise();

  return expect(result).rejects.toEqual(error);
});
