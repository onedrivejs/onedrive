const { take, share } = require('rxjs/operators');
const { DateTime } = require('luxon');
const fetchItem = require('./item');
const createFetch = require('../fetch');
const getParent = require('./parent');
const uploadFile = require('./upload');

jest.mock('node-fetch');
jest.mock('../fetch');
jest.mock('./parent');
jest.mock('./item');
jest.mock('fs');
jest.mock('../../separator', () => () => jest.fn(stream => stream));

const timeout = ms => (
  new Promise(resolve => setTimeout(resolve, ms))
);

const mockJsonValue = {
  parentReference: {
    driveId: 'abcd',
  },
};
const json = jest.fn()
  .mockResolvedValue(mockJsonValue);

const mockFetchValue = {
  ok: true,
  json,
};
const fetch = jest.fn()
  .mockResolvedValue(mockFetchValue);

createFetch.mockResolvedValue(fetch);
fetchItem.mockImplementation(fetch);
getParent.mockResolvedValue({
  id: '1234',
  parentReference: {
    driveId: 'abcd',
  },
});

const content = jest.fn();


test('upload file', () => {
  const name = 'test.txt';
  const result = uploadFile('1234', 'test.txt', 'abcd', DateTime.local(), 128, content).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file large', () => {
  const name = 'test.txt';
  const result = uploadFile('1234', name, 'abcd', DateTime.local(), 104857600, content).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file large file subdirectory', () => {
  const name = 'test/test.txt';
  const result = uploadFile('1234', name, 'abcd', DateTime.local(), 104857600, content).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file that has a matching hash', () => {
  const hash = 'abcd';
  json.mockResolvedValueOnce({
    file: {
      hashes: {
        sha1Hash: hash,
      },
    },
  });
  const result = uploadFile('1234', 'test.txt', hash, DateTime.local(), 128, content).toPromise();

  return expect(result).resolves.toBeUndefined();
});

test('upload file that does not yet exist', () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    json,
  });

  const name = 'test.txt';
  const result = uploadFile('1234', 'test.txt', 'abcd', DateTime.local(), 128, content).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file that fails to retrieve stats', () => {
  const name = 'test.txt';
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${name}`;
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url,
    json,
  };
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;

  const result = uploadFile('1234', 'test.txt', 'abcd', DateTime.local(), 128, content).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('upload file that fails to retrieve upload url', () => {
  const name = 'test.txt';
  const url = `https://graph.microsoft.com/v1.0/me/drive/items/root:/${name}:/createUploadSession`;
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url,
    json,
  };
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce(data);
  const error = new Error(`${data.status} ${data.statusText} ${url}`);
  error.data = data;

  const result = uploadFile('1234', name, 'abcd', DateTime.local(), 128, content).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('upload file that is newer', () => {
  const hash = 'abcd';
  json.mockResolvedValueOnce({
    lastModifiedDateTime: DateTime.local().toISO(),
  });

  const result = uploadFile('1234', 'test.txt', hash, DateTime.local().minus({ days: 1 }), 128, content).toPromise();

  return expect(result).resolves.toBeUndefined();
});

test('upload file failure', () => {
  const data = {
    ok: false,
    status: 500,
    statusText: 'ERROR',
    url: undefined,
    json,
  };
  const error = new Error(`${data.status} ${data.statusText} ${undefined}`);
  fetch.mockResolvedValueOnce(mockFetchValue)
    .mockResolvedValueOnce(mockFetchValue)
    .mockResolvedValueOnce(data);
  const result = uploadFile('1234', 'test.txt', 'abcd', DateTime.local(), 104857600, content).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('upload file empty', () => {
  const name = 'test.txt';
  const result = uploadFile('1234', 'test.txt', 'abcd', DateTime.local(), 0, content).toPromise();

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('upload file will cancel', () => {
  const name = 'test.txt';
  const upload = uploadFile('1234', 'test.txt', 'abcd', DateTime.local(), 128, content).pipe(
    share(),
  );

  const result = upload.toPromise();

  // Cancel the download.
  upload.pipe(take(1)).subscribe(({ cancel }) => cancel());

  return expect(result).resolves.toEqual({
    action: 'upload',
    phase: 'cancel',
    type: 'file',
    name,
  });
});

test('upload large file will cancel', () => {
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockResolvedValueOnce(mockFetchValue);
  fetch.mockImplementationOnce(() => timeout(10).then(() => mockFetchValue));
  const name = 'test.txt';
  const upload = uploadFile('1234', 'test.txt', 'abcd', DateTime.local(), 104857600, content).pipe(
    share(),
  );

  const result = upload.toPromise();

  // Cancel the download.
  upload.pipe(take(1)).toPromise().then(({ cancel }) => timeout(5).then(() => cancel()));

  // Ensure that everything is done before assertions.
  return timeout(50).then(() => {
    expect(result).resolves.toEqual({
      action: 'upload',
      phase: 'cancel',
      type: 'file',
      name,
    });
  });
});
