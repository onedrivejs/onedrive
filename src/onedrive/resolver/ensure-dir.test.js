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
      parentReference: {
        driveId: 'abc',
      },
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '123',
    driveId: 'abc',
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
    url: 'https://graph.microsoft.com/v1.0/me/drive/items/root/children',
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).rejects.toEqual(new Error('500 FAIL! https://graph.microsoft.com/v1.0/me/drive/items/root/children'));
});

test('creates a folder within a subfolder', () => {
  const json = jest.fn()
    .mockResolvedValueOnce({
      id: '123',
      name: 'test',
      parentReference: {
        driveId: 'abc',
      },
    })
    .mockResolvedValueOnce({
      id: '456',
      name: 'test',
      parentReference: {
        id: '123',
        driveId: 'abc',
      },
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a subfolder no parent reference', () => {
  const json = jest.fn()
    .mockResolvedValueOnce({
      id: '123',
      name: 'test',
    })
    .mockResolvedValueOnce({
      id: '456',
      name: 'test',
      parentReference: {
        id: '123',
        driveId: 'abc',
      },
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a remote item', () => {
  const json = jest.fn()
    .mockResolvedValueOnce({
      id: '123',
      name: 'test',
      remoteItem: {
        id: '789',
        parentReference: {
          driveId: 'def',
        },
      },
    })
    .mockResolvedValueOnce({
      id: '456',
      name: 'test',
      parentReference: {
        id: '789',
        driveId: 'abc',
      },
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a remote item no parent reference', () => {
  const json = jest.fn()
    .mockResolvedValueOnce({
      id: '123',
      name: 'test',
      remoteItem: {
        id: '789',
      },
    })
    .mockResolvedValueOnce({
      id: '456',
      name: 'test',
      parentReference: {
        id: '789',
        driveId: 'abc',
      },
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});
