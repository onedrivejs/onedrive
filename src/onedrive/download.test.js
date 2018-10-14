const fetch = require('node-fetch');
const download = require('./download');

jest.mock('node-fetch');
jest.mock('../utils/logger');

const mockFetchValue = {
  ok: true,
};
fetch.mockResolvedValue(mockFetchValue);

test('create downloader', () => {
  const result = download('https://example.com')();

  return expect(result).resolves.toEqual(mockFetchValue);
});

test('create downloader network failure', () => {
  fetch.mockRejectedValueOnce(new Error());
  const result = download('https://example.com')();

  return expect(result).resolves.toEqual(mockFetchValue);
});
