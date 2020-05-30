const { Subject } = require('rxjs');
const { take, share } = require('rxjs/operators');
const { DateTime } = require('luxon');
const createStream = require('./stream');
const createDownload = require('./download');
const delta = require('./delta');
const ResolveError = require('../error/resolve');

jest.mock('./delta');
jest.mock('./download');

const fetch = jest.fn().mockResolvedValue({});
const downloader = jest.fn().mockReturnValue(fetch);
createDownload.mockReturnValue(downloader);

test('creating a filesystem stream', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

  expect(stream).toBeDefined();
});

test('add event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234').pipe(share());

  const data = Promise.all([
    stream.pipe(take(1)).toPromise(),
    stream.pipe(take(2)).toPromise(),
  ]);

  subject.next({
    id: '123',
    name: 'test',
    folder: {},
    parentReference: {
      path: '/drive/root:',
    },
  });

  subject.next({
    id: '321',
    name: 'test.jpg',
    file: {
      hashes: {
        sha1Hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      },
    },
    parentReference: {
      path: '/drive/root:/test',
    },
    '@microsoft.graph.downloadUrl': 'https://example.com',
  });

  return expect(data).resolves.toEqual([
    {
      action: 'add',
      download: null,
      id: '123',
      modified: null,
      type: 'folder',
      name: 'test',
      hash: null,
    },
    {
      action: 'add',
      id: '321',
      modified: null,
      type: 'file',
      name: 'test/test.jpg',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      download: downloader,
    },
  ]);
});

test('unhandled item type', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(1)).toPromise();

  const expectation = expect(data).resolves.toEqual({
    action: 'error',
    id: '123',
    name: 'test',
    type: 'unknown',
    error: new ResolveError(),
  });

  subject.next({
    id: '123',
    name: 'test',
  });

  return expectation;
});


test('change event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(2)).toPromise();

  const item = {
    id: '321',
    name: 'test.jpg',
    file: {
      hashes: {
        sha1Hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      },
    },
    parentReference: {
      path: '/drive/root:/test',
    },
    '@microsoft.graph.downloadUrl': 'https://example.com',
  };

  subject.next(item);
  subject.next({
    ...item,
    file: {
      ...item.file,
      hashes: {
        ...item.file.hashes,
        sha1Hash: 'abcdef',
      },
    },
  });

  return expect(data).resolves.toEqual({
    action: 'change',
    id: '321',
    modified: null,
    type: 'file',
    name: 'test/test.jpg',
    hash: 'abcdef',
    download: downloader,
  });
});

test('remove event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(1)).toPromise();

  subject.next({
    id: '321',
    name: 'test.jpg',
    file: {},
    deleted: {},
    parentReference: {
      path: '/drive/root:/test',
    },
  });

  return expect(data).resolves.toEqual({
    action: 'remove',
    download: null,
    hash: null,
    id: '321',
    modified: null,
    type: 'file',
    name: 'test/test.jpg',
  });
});

test('remove event with non-existant parent', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(2)).toPromise();

  subject.next({
    id: '321',
    name: 'test.jpg',
    file: {
      hash: '1234',
    },
    parentReference: {
      path: '/drive/root:/test',
    },
  });
  subject.next({
    id: '321',
    name: 'test.jpg',
    file: {},
    deleted: {},
  });

  return expect(data).resolves.toEqual({
    action: 'remove',
    download: null,
    hash: null,
    id: '321',
    modified: null,
    type: 'file',
    name: 'test/test.jpg',
  });
});

test('move event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(2)).toPromise();

  const item = {
    id: '321',
    name: 'test.jpg',
    file: {
      hashes: {
        sha1Hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      },
    },
    parentReference: {
      path: '/drive/root:/test',
    },
    '@microsoft.graph.downloadUrl': 'https://example.com',
  };

  subject.next(item);
  subject.next({
    ...item,
    name: 'test2.jpg',
  });

  return expect(data).resolves.toEqual({
    action: 'move',
    id: '321',
    modified: null,
    type: 'file',
    name: 'test/test2.jpg',
    hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    download: downloader,
    oldName: 'test/test.jpg',
  });
});

test('copy event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(2)).toPromise();

  const item = {
    id: '321',
    name: 'test.jpg',
    file: {
      hashes: {
        sha1Hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      },
    },
    parentReference: {
      path: '/drive/root:/test',
    },
    '@microsoft.graph.downloadUrl': 'https://example.com',
  };

  subject.next(item);
  subject.next({
    ...item,
    name: 'test2.jpg',
    id: '123',
  });

  return expect(data).resolves.toEqual({
    action: 'copy',
    id: '123',
    modified: null,
    type: 'file',
    name: 'test/test2.jpg',
    from: 'test/test.jpg',
    hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    download: downloader,
  });
});

test('modified time returns datetime object', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(1)).toPromise();

  subject.next({
    id: '321',
    name: 'test.jpg',
    lastModifiedDateTime: '2018-07-23T16:27:17.13Z"',
    file: {
      hashes: {
        sha1Hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      },
    },
    parentReference: {
      path: '/drive/root:/test',
    },
    '@microsoft.graph.downloadUrl': 'https://example.com',
  });

  return data.then((event) => {
    expect(event.modified).toBeInstanceOf(DateTime);
  });
});

test('remote item starts new delta', () => {
  const subject = new Subject();
  const remoteItemSubject = new Subject();
  delta.mockReturnValueOnce(subject);
  delta.mockReturnValueOnce(remoteItemSubject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(2)).toPromise();

  subject.next({
    id: '321',
    name: 'test',
    parentReference: {
      path: '/drive/root:',
    },
    remoteItem: {
      id: '123',
      parentReference: {
        driveId: 'abcd',
      },
    },
  });

  remoteItemSubject.next({
    id: '456',
    name: 'test.txt',
    file: {
      hashes: {
        sha1Hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      },
    },
    parentReference: {
      id: '123',
      path: '/drives/abcd/items/321:',
    },
    '@microsoft.graph.downloadUrl': 'https://example.com',
  });

  return expect(data).resolves.toEqual({
    action: 'add',
    id: '456',
    modified: null,
    type: 'file',
    name: 'test/test.txt',
    hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    download: downloader,
  });
});

test('remote item is deleted', () => {
  const subject = new Subject();
  const remoteItemSubject = new Subject();
  delta.mockReturnValueOnce(subject);
  delta.mockReturnValueOnce(remoteItemSubject);
  const stream = createStream('1234').pipe(share());

  const data = stream.pipe(take(2)).toPromise();

  subject.next({
    id: '321',
    name: 'test',
    parentReference: {
      path: '/drive/root:',
    },
    remoteItem: {
      id: '123',
      parentReference: {
        driveId: 'abcd',
      },
    },
  });

  subject.next({
    id: '321',
    name: 'test',
    remoteItem: {},
    deleted: {},
    parentReference: {
      path: '/drive/root:',
    },
  });


  return expect(data).resolves.toEqual({
    action: 'remove',
    id: '321',
    name: 'test',
    type: 'folder',
    hash: null,
    modified: null,
    download: null,
  });
});
