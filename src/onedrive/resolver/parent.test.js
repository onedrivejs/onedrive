const getParent = require('./parent');

jest.mock('./ensure-dir');

const json = jest.fn()
  .mockResolvedValue({});

const mockFetchValue = {
  ok: true,
  json,
};

const fetch = jest.fn()
  .mockResolvedValue(mockFetchValue);

test('get parent id', () => {
  const result = getParent(fetch, 'test.txt');
  return expect(result).resolves.toBeUndefined();
});

test('get parent id subfolder', () => {
  const result = getParent(fetch, 'test/test.txt');
  return expect(result).resolves.toBeUndefined();
});

test('get parent id request error', () => {
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url: 'https://graph.microsoft.com/v1.0/me/drive/items/root',
    json,
  };
  const error = new Error(`${data.status} ${data.statusText} ${data.url}`);
  error.data = {};
  fetch.mockResolvedValueOnce(data);
  const result = getParent(fetch, 'test.txt');

  return expect(result).rejects.toEqual(error);
});
