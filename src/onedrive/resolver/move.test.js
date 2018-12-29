const fetchItem = require('./item');
const getParent = require('./parent');
const createFetch = require('../fetch');
const move = require('./move');

jest.mock('node-fetch');
jest.mock('../fetch');
jest.mock('./parent');
jest.mock('./item');
jest.mock('fs');

const mockFrom = {
  id: '123',
  parentReference: {
    driveId: 'abc',
  },
};

const json = jest.fn()
  .mockResolvedValue(mockFrom);

const mockFetchValue = {
  ok: true,
  json,
};
const fetch = jest.fn()
  .mockResolvedValue(mockFetchValue);

createFetch.mockResolvedValue(fetch);
fetchItem.mockImplementation(fetch);
getParent.mockResolvedValue(mockFrom);

test('move file', () => {
  const type = 'file';
  const name = 'test2.txt';
  const result = move('1234', type, name, mockFrom).toPromise();

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
  const result = move('1234', type, name, mockFrom).toPromise();

  return expect(result).resolves.toEqual({
    action: 'move',
    phase: 'end',
    type,
    name,
  });
});

test('move file unkown error', () => {
  const type = 'file';
  const name = 'test2.txt';
  const oldName = 'test.txt';
  const url = `me/drive/root:/${oldName}`;
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
  const result = move('1234', type, name, mockFrom).toPromise();

  return expect(result).rejects.toEqual(error);
});
