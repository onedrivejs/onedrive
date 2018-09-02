const fetch = require('node-fetch');
const download = require('./download');

jest.mock('node-fetch');

const mockFetchValue = {
  ok: true,
};
fetch.mockResolvedValue(mockFetchValue);

test('create downloader', () => {
  const result = download('https://example.com')();

  return expect(result).resolves.toEqual(mockFetchValue);
});
