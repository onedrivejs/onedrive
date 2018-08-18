const { Subject } = require('rxjs');
const { take } = require('rxjs/operators');
const { DateTime } = require('luxon');
const createStream = require('./stream');
const delta = require('./delta');

jest.mock('./delta');

test('creating a filesystem stream', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

  expect(stream).toBeDefined();
});

test('add event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

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
      downloadUrl: null,
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
      downloadUrl: 'https://example.com',
    },
  ]);
});

test('unhandled item type', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

  const data = stream.pipe(take(1)).toPromise();

  const expectation = expect(data).rejects.toEqual(new Error('Unhandled item type'));

  subject.next({
    id: '123',
    name: 'test',
  });

  return expectation;
});


test('change event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

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
    downloadUrl: 'https://example.com',
  });
});

test('remove event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

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
    downloadUrl: null,
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
  const stream = createStream('1234');

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
    downloadUrl: null,
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
  const stream = createStream('1234');

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
    downloadUrl: 'https://example.com',
    oldName: 'test/test.jpg',
  });
});

test('copy event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

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
    downloadUrl: 'https://example.com',
  });
});

test('modified time returns datetime object', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

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
