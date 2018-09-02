const download = require('./download');
const createFetch = require('./fetch');

jest.mock('./fetch');

const mockFetchValue = {
  ok: true,
};
const fetch = jest.fn().mockResolvedValue(mockFetchValue);
createFetch.mockResolvedValue(fetch);

test('create downloader', () => {
  const result = download('abcdef')('https://example.com')();

  return expect(result).resolves.toEqual(mockFetchValue);
});
