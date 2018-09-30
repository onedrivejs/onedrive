const fetch = require('node-fetch');
const { Observable } = require('rxjs');
const { take } = require('rxjs/operators');
const delta = require('./delta');
const createFetch = require('./fetch');

jest.mock('node-fetch');
jest.mock('./fetch');
jest.mock('../utils/logger');
jest.useFakeTimers();

beforeEach(() => {
  jest.resetAllMocks();
});

test('resolves the first response immediatly', () => {
  const json = jest.fn()
    .mockResolvedValueOnce({
      '@odata.deltaLink': 'https://example.com',
      value: [
        {
          id: '123',
        },
      ],
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const stream = delta('1234');

  expect(stream).toBeInstanceOf(Observable);

  const data = stream.pipe(take(1)).toPromise();

  return expect(data).resolves.toEqual({
    id: '123',
  });
});

test('immediaitely call the next link', () => {
  const json = jest.fn()
    .mockResolvedValue({
      '@odata.deltaLink': 'https://example.com',
      value: [],
    })
    .mockResolvedValueOnce({
      '@odata.nextLink': 'https://example.com',
      value: [
        {
          id: '123',
        },
      ],
    })
    .mockResolvedValueOnce({
      '@odata.deltaLink': 'https://example.com',
      value: [
        {
          id: '321',
        },
      ],
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const stream = delta('1234');

  // toPromise does not work for some reason.
  stream.pipe(take(1)).subscribe((d) => {
    expect(d).toEqual({
      id: '123',
    });
  });
  stream.pipe(take(2)).subscribe((d) => {
    expect(d).toEqual({
      id: '321',
    });
  });
});

test('retry if request fails', () => {
  const json = jest.fn()
    .mockResolvedValue({
      '@odata.deltaLink': 'https://example.com',
      value: [],
    })
    .mockResolvedValueOnce({
      '@odata.deltaLink': 'https://example.com',
      value: [
        {
          id: '123',
        },
      ],
    });

  fetch
    .mockResolvedValue({
      ok: true,
      json,
    })
    .mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Not OK',
    });

  createFetch.mockResolvedValue(fetch);

  const stream = delta('1234');

  // toPromise does not work for some reason.
  stream.pipe(take(1)).subscribe((d) => {
    expect(d).toEqual({
      id: '123',
    });
  });

  jest.runOnlyPendingTimers();
});

test('reject when no next or delta link is present', () => {
  const json = jest.fn();
  json.mockResolvedValue({});
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const stream = delta('1234');
  const data = stream.pipe(take(1)).toPromise();

  return expect(data).rejects.toEqual(new Error('OneDrive API did not return a nextLink or deltaLink'));
});

test('delta with drive id and item id', () => {
  const json = jest.fn()
    .mockResolvedValueOnce({
      '@odata.deltaLink': 'https://example.com',
      value: [
        {
          id: '123',
        },
      ],
    });
  fetch.mockResolvedValue({
    ok: true,
    json,
  });
  createFetch.mockResolvedValue(fetch);

  const stream = delta('sdsdkfd', 'abcd', '1234');

  expect(stream).toBeInstanceOf(Observable);

  const data = stream.pipe(take(1)).toPromise();

  return expect(data).resolves.toEqual({
    id: '123',
  });
});
