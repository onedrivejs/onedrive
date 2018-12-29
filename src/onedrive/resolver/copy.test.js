const fetchItem = require('./item');
const createFetch = require('../fetch');
const getParent = require('./parent');
const copy = require('./copy');

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

const mockParent = {
  id: '123',
  driveId: 'abc',
};
getParent.mockResolvedValue(mockParent);

test('copy file', () => {
  const type = 'file';
  const name = 'test2.txt';
  const result = copy('1234', name, mockFrom).toPromise();

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
  const result = copy('1234', name, mockFrom).toPromise();

  return expect(result).resolves.toEqual({
    action: 'copy',
    phase: 'end',
    type,
    name,
  });
});

test('copy file unkown error', () => {
  const name = 'test2.txt';
  const fromName = 'test.txt';
  const url = `me/drive/root:/${fromName}`;
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
  const result = copy('1234', name, mockFrom).toPromise();

  return expect(result).rejects.toEqual(error);
});
