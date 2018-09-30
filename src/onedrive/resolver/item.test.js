const fetchItem = require('./item');

const mockJson = jest.fn()
  .mockResolvedValue({});

const mockResponse = {
  ok: true,
  json: mockJson,
};

const fetch = jest.fn()
  .mockResolvedValue(mockResponse);

test('fetch item', () => {
  const result = fetchItem(fetch, 'text.txt');
  return expect(result).resolves.toEqual(mockResponse);
});

test('fetch item in subdirectory', () => {
  const result = fetchItem(fetch, 'test/text.txt');
  return expect(result).resolves.toEqual(mockResponse);
});

test('fetch item parent failure', () => {
  fetch.mockResolvedValueOnce({
    ...mockResponse,
    ok: false,
  });
  const result = fetchItem(fetch, 'test/text.txt');
  return expect(result).resolves.toEqual({
    ...mockResponse,
    ok: false,
  });
});

test('fetch item parent shared folder', () => {
  mockJson.mockResolvedValueOnce({
    remoteItem: {
      id: '123',
      parentReference: {
        driveId: 'abc',
      },
    },
  });
  const result = fetchItem(fetch, 'test/text.txt');
  return expect(result).resolves.toEqual(mockResponse);
});
