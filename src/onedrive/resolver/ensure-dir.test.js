const ensureDir = require('./ensure-dir');

jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllMocks();
});

const mockJsonResult = {
  id: '123',
  parentReference: {
    driveId: 'abc',
  },
};

const mockJson = jest.fn().mockResolvedValue(mockJsonResult);

const mockFetchResult = {
  ok: true,
  json: mockJson,
};

const fetch = jest.fn().mockResolvedValue(mockFetchResult);

test('creates a folder in the root', () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });
  mockJson.mockResolvedValueOnce({
    ...mockJsonResult,
    folder: {},
  });
  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '123',
    driveId: 'abc',
  });
});

test('creates a folder in the root failure', () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });
  mockJson.mockResolvedValueOnce({
    error: {
      message: 'BOO!',
    },
  });
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 500,
    statusText: 'FAIL!',
    url: 'https://graph.microsoft.com/v1.0/me/drive/items/root/children',
    json: mockJson,
  });

  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).rejects.toEqual(new Error('500 FAIL! https://graph.microsoft.com/v1.0/me/drive/items/root/children'));
});

test('creates a folder within a subfolder', () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      id: '123',
      name: 'test',
      folder: {},
      parentReference: {
        driveId: 'abc',
      },
    }),
  });
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      id: '456',
      name: 'test',
      parentReference: {
        id: '123',
        driveId: 'abc',
      },
    }),
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a subfolder no parent reference', () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      id: '123',
      name: 'test',
      folder: {},
    }),
  });
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      id: '456',
      name: 'test',
      parentReference: {
        id: '123',
        driveId: 'abc',
      },
    }),
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a remote item', () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      id: '123',
      name: 'test',
      remoteItem: {
        id: '789',
        parentReference: {
          driveId: 'def',
        },
      },
    }),
  });
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      id: '456',
      name: 'test',
      parentReference: {
        id: '789',
        driveId: 'abc',
      },
    }),
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a remote item no parent reference', () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      id: '123',
      name: 'test',
      remoteItem: {
        id: '789',
      },
    }),
  });
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      id: '456',
      name: 'test',
      parentReference: {
        id: '789',
        driveId: 'abc',
      },
    }),
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder in the root with conflict', () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 409,
    json: jest.fn().mockResolvedValue({
      ...mockJsonResult,
      folder: {},
    }),
  });
  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue({
      ...mockJsonResult,
      remoteItem: {
        id: '999',
        parentReference: {
          driveId: 'zzz',
        },
      },
    }),
  });

  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '999',
    driveId: 'zzz',
  });
});

test('creates a folder within a subfolder with conflict', () => {
  const parent = {
    id: '123',
    name: 'test',
    folder: {},
    parentReference: {
      driveId: 'abc',
    },
  };

  const child = {
    id: '456',
    name: 'test',
    parentReference: {
      id: '123',
      driveId: 'abc',
    },
    folder: {},
  };

  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue(parent),
  });

  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });

  fetch.mockResolvedValueOnce({
    ok: false,
    status: 409,
    json: jest.fn().mockResolvedValue(child),
  });

  fetch.mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValue(child),
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder in the root with unresolvable conflict', () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json: jest.fn().mockResolvedValue({}),
  });
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 409,
    json: mockJson,
  });

  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).rejects.toBeInstanceOf(Error);
});

test('creates a folder where a non-folder already exists', () => {
  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).rejects.toBeInstanceOf(Error);
});
