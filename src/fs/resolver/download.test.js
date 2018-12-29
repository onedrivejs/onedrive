const { take, share } = require('rxjs/operators');
const { DateTime } = require('luxon');
const { stat, utimes } = require('fs');
const { move, remove } = require('fs-extra');
const { fromFile: hashFromFile } = require('hasha');
const promisePipe = require('promisepipe');
const downloadFile = require('./download');

const timeout = ms => (
  new Promise(resolve => setTimeout(resolve, ms))
);

jest.mock('fs');
jest.mock('graceful-fs', () => jest.mock('fs'));
jest.mock('fs-extra');
jest.mock('hasha');
jest.mock('promisepipe');
jest.mock('stream');

hashFromFile.mockResolvedValue('');
// promisePipe.mockResolvedValue(undefined);
promisePipe.mockResolvedValue(undefined);

const mockResponse = {
  ok: true,
  body: {
    pipe: jest.fn(),
  },
};

const downloader = jest.fn().mockResolvedValue(mockResponse);

const mockStats = jest.fn().mockResolvedValue({});
stat.mockImplementation((path, options, callback) => {
  if (typeof options === 'function') {
    return options(undefined, mockStats());
  }

  return callback(undefined, mockStats());
});
utimes.mockImplementation((path, atime, mtime, callback) => callback(undefined));

test('should download file with identical hash', () => {
  hashFromFile.mockResolvedValueOnce('1234');
  const result = downloadFile('/data', 'test.txt', '1234', DateTime.local()).toPromise();

  return expect(result).resolves.toEqual(undefined);
});

test('should download file that is newer', () => {
  const name = 'test.txt';
  mockStats.mockResolvedValueOnce({
    mtime: new Date(),
  });
  const result = downloadFile('/data', name, '1234', DateTime.local().minus({ days: 1 })).toPromise();

  return expect(result).resolves.toEqual(undefined);
});

test('should download file that does not exist', () => {
  const name = 'test.txt';
  const error = new Error();
  error.code = 'ENOENT';
  hashFromFile.mockRejectedValueOnce(error);
  const result = downloadFile('/data', name, '1234', DateTime.local(), downloader).toPromise();

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('should download file that throws an error', () => {
  const error = new Error();
  hashFromFile.mockRejectedValueOnce(error);
  const result = downloadFile('/data', 'test.txt', '1234', DateTime.local()).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('download file', () => {
  const name = 'test.txt';
  const result = downloadFile('/data', name, 'abcd', DateTime.local(), downloader).toPromise();

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('download file bad response', () => {
  const response = {
    ok: false,
    status: 404,
    url: 'https://example.com',
    statusText: 'Not Found',
  };
  downloader.mockResolvedValueOnce(response);
  const error = new Error(`${response.status} ${response.statusText} ${response.url}`);
  const name = 'test.txt';
  const result = downloadFile('/data', name, 'abcd', DateTime.local(), downloader).toPromise();

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'error',
    type: 'file',
    name,
    error,
  });
});

test('download file will override', () => {
  const error = new Error();
  move.mockRejectedValueOnce(error);
  const name = 'test.txt';
  const result = downloadFile('/data', name, 'abcd', DateTime.local(), downloader).toPromise();

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'end',
    type: 'file',
    name,
  });
});

test('download file will throw error', () => {
  const error = new Error();
  promisePipe.mockRejectedValueOnce(error);
  const name = 'test.txt';
  const result = downloadFile('/data', name, 'abcd', DateTime.local(), downloader).toPromise();

  return expect(result).rejects.toEqual(error);
});

test('download file will cancel', () => {
  const name = 'test.txt';
  const download = downloadFile('/data', name, 'abcd', DateTime.local(), downloader).pipe(
    share(),
  );

  const result = download.toPromise();

  // Cancel the download.
  download.pipe(take(1)).subscribe(({ cancel }) => cancel());

  return expect(result).resolves.toEqual({
    action: 'download',
    phase: 'cancel',
    type: 'file',
    name,
  });
});

test('download file will cancel while pipping', () => {
  // Delay the promise pipe.
  promisePipe.mockImplementationOnce(() => timeout(10).then(() => undefined));
  const name = 'test.txt';
  const download = downloadFile('/data', name, 'abcd', DateTime.local(), downloader).pipe(
    share(),
  );

  const result = download.toPromise();

  // Cancel the download.
  download.pipe(take(1)).toPromise().then(({ cancel }) => timeout(5).then(() => cancel()));

  // Ensure that everything is done before assertions.
  return timeout(15).then(() => {
    expect(remove).toBeCalled();
    expect(result).resolves.toEqual({
      action: 'download',
      phase: 'cancel',
      type: 'file',
      name,
    });
  });
});
