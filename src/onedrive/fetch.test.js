const nodeFetch = require('node-fetch');
const createFetch = require('./fetch');
const client = require('./client');

jest.mock('node-fetch');
jest.mock('./client');
jest.mock('../utils/logger');

const mockRefresh = jest.fn().mockResolvedValue({
  token: {
    access_token: '4321',
  },
});

client.accessToken.create.mockReturnValue({
  refresh: mockRefresh,
});

const mockResponse = {
  ok: true,
};

nodeFetch.mockResolvedValue(mockResponse);

test('returns a function', () => {
  const fetch = createFetch('1234');

  return expect(fetch).resolves.toBeInstanceOf(Function);
});

test('returns a response object', () => {
  const response = createFetch('1234').then(fetch => fetch('https://example.com'));

  return expect(response).resolves.toEqual(mockResponse);
});

test('retries after 429', () => {
  const headers = new Map();
  headers.set('Retry-After', 1);
  nodeFetch.mockResolvedValueOnce({
    status: 429,
    headers,
  });
  nodeFetch.mockResolvedValueOnce(mockResponse);
  const response = createFetch('1234').then(fetch => fetch('https://example.com'));

  return expect(response).resolves.toEqual(mockResponse);
});

test('retries after 500', () => {
  nodeFetch.mockResolvedValueOnce({
    status: 500,
  });
  nodeFetch.mockResolvedValueOnce(mockResponse);
  const response = createFetch('1234').then(fetch => fetch('https://example.com'));

  return expect(response).resolves.toEqual(mockResponse);
});

test('retries after access token network failure', () => {
  mockRefresh.mockRejectedValueOnce(new Error());
  const response = createFetch('1234').then(fetch => fetch('https://example.com'));

  return expect(response).resolves.toEqual(mockResponse);
});

test('retries after network failure', () => {
  nodeFetch.mockRejectedValueOnce(new Error());
  const response = createFetch('1234').then(fetch => fetch('https://example.com'));

  return expect(response).resolves.toEqual(mockResponse);
});
