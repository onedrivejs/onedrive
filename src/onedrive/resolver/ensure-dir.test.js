const fetch = require('node-fetch');
const createFetch = require('../fetch');
const ensureDir = require('./ensure-dir');

jest.mock('node-fetch');
jest.mock('../fetch');
jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllMocks();
});

test('creates a folder in the root', () => {
  const json = jest.fn()
    .mockResolvedValueOnce({
      id: '123',
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual('123');
});

test('creates a folder in the root failure', () => {
  const json = jest.fn()
    .mockResolvedValueOnce({
      error: {
        message: 'BOO!',
      },
    });
  fetch.mockResolvedValue({
    ok: false,
    status: 500,
    statusText: 'FAIL!',
    url: 'https://graph.microsoft.com/v1.0/me/drive/items/root/children',
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).rejects.toEqual(new Error('500 FAIL! https://graph.microsoft.com/v1.0/me/drive/items/root/children'));
});
