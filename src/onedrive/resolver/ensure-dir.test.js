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
  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '123',
    driveId: 'abc',
  });
});

test('creates a folder in the root failure', () => {
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
  mockJson.mockResolvedValueOnce({
    id: '123',
    name: 'test',
    parentReference: {
      driveId: 'abc',
    },
  }).mockResolvedValueOnce({
    id: '456',
    name: 'test',
    parentReference: {
      id: '123',
      driveId: 'abc',
    },
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a subfolder no parent reference', () => {
  mockJson.mockResolvedValueOnce({
    id: '123',
    name: 'test',
  }).mockResolvedValueOnce({
    id: '456',
    name: 'test',
    parentReference: {
      id: '123',
      driveId: 'abc',
    },
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a remote item', () => {
  mockJson.mockResolvedValueOnce({
    id: '123',
    name: 'test',
    remoteItem: {
      id: '789',
      parentReference: {
        driveId: 'def',
      },
    },
  }).mockResolvedValueOnce({
    id: '456',
    name: 'test',
    parentReference: {
      id: '789',
      driveId: 'abc',
    },
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder within a remote item no parent reference', () => {
  mockJson.mockResolvedValueOnce({
    id: '123',
    name: 'test',
    remoteItem: {
      id: '789',
    },
  }).mockResolvedValueOnce({
    id: '456',
    name: 'test',
    parentReference: {
      id: '789',
      driveId: 'abc',
    },
  });

  const name = 'test/test2';
  const result = ensureDir(fetch, name);

  return expect(result).resolves.toEqual({
    id: '456',
    driveId: 'abc',
  });
});

test('creates a folder in the root with conflict', () => {
  mockJson.mockResolvedValueOnce(mockJsonResult);
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 409,
    json: mockJson,
  });
  mockJson.mockResolvedValueOnce({
    ...mockJsonResult,
    remoteItem: {
      id: '999',
      parentReference: {
        driveId: 'zzz',
      },
    },
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
  mockJson.mockResolvedValueOnce(parent);
  mockJson.mockResolvedValueOnce(child);
  mockJson.mockResolvedValueOnce(child);

  fetch.mockResolvedValueOnce(mockFetchResult);
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 409,
    json: mockJson,
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
    status: 409,
    json: mockJson,
  });

  const name = 'test';
  const result = ensureDir(fetch, name);

  return expect(result).rejects.toBeInstanceOf(Error);
});
