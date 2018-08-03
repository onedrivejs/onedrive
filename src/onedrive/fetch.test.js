const nodeFetch = require('node-fetch');
const createFetch = require('./fetch');
const client = require('./client');

jest.mock('node-fetch');
jest.mock('./client');

client.accessToken.create.mockReturnValue({
  refresh: jest.fn().mockReturnValue({
    token: {
      access_token: '4321',
    },
  }),
});

test('returns a function', () => {
  const fetch = createFetch('1234');

  return expect(fetch).resolves.toBeInstanceOf(Function);
});

test('returns a response object', () => {
  const data = {
    ok: true,
  };
  nodeFetch.mockReturnValueOnce(data);
  const response = createFetch('1234').then(fetch => fetch('https://example.com'));

  return expect(response).resolves.toEqual(data);
});

test('throws an error when response is not ok.', () => {
  const data = {
    ok: false,
    statusText: 'Not OK',
  };
  nodeFetch.mockReturnValueOnce(data);
  const response = createFetch('1234').then(fetch => fetch('https://example.com'));

  return expect(response).rejects.toEqual(new Error('Not OK'));
});
