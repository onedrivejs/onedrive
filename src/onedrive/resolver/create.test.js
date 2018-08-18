const fetch = require('node-fetch');
const createFetch = require('../fetch');
const createFolder = require('./create');

jest.mock('node-fetch');
jest.mock('../fetch');
jest.useFakeTimers();

beforeEach(() => {
  jest.resetAllMocks();
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
  const result = createFolder('abcd', name);

  return expect(result).resolves.toEqual({
    action: 'create',
    phase: 'end',
    type: 'folder',
    name,
  });
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
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test';
  const result = createFolder('abcd', name);

  return expect(result).resolves.toEqual({
    action: 'create',
    phase: 'error',
    type: 'folder',
    name,
    error: new Error('500 FAIL! https://graph.microsoft.com/v1.0/me/drive/items/root/children'),
  });
});
