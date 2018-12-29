const createFetch = require('./fetch');
const download = require('./download');

jest.mock('./fetch');

const mockFetchValue = {
  ok: true,
};
const fetch = jest.fn().mockResolvedValue(mockFetchValue);

createFetch.mockResolvedValue(fetch);

test('create downloader', () => {
  const result = download('abcdef', 1234, 'zdef')();

  return expect(result).resolves.toEqual(mockFetchValue);
});

test('create downloader network failure', () => {
  const error = new Error();
  fetch.mockRejectedValueOnce(error);
  const result = download('abcdef', 1234, 'zdef')();

  return expect(result).rejects.toEqual(error);
});
