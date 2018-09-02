const { Client } = require('fb-watchman');
const EventEmitter = require('events');
const { DateTime } = require('luxon');
const { take } = require('rxjs/operators');
const createStream = require('./stream');

jest.mock('fb-watchman');
jest.mock('./content');

Client.mockImplementation(() => {
  const mockClient = new EventEmitter();
  mockClient.command = jest.fn();
  return mockClient;
});

test('creating a filesystem stream', () => {
  const stream = createStream(new Client(), 'data');

  expect(stream).toBeDefined();
});

test('add event', () => {
  const client = new Client();
  const stream = createStream(client, 'data');

  const data = Promise.all([
    stream.pipe(take(1)).toPromise(),
    stream.pipe(take(2)).toPromise(),
    stream.pipe(take(3)).toPromise(),
  ]);

  client.emit('subscription', {
    files: [
      {
        name: 'test',
        ino: 123,
        'content.sha1hex': null,
        type: 'd',
        exists: true,
        new: true,
      },
      {
        name: 'test/test.jpg',
        ino: 321,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'f',
        exists: true,
        new: true,
      },
      {
        name: 'test/test2.jpg',
        ino: 567,
        'content.sha1hex': {
          error: 'changed',
        },
        type: 'f',
        exists: true,
        new: true,
      },
    ],
  });

  client.emit('subscription', {
    files: [
      {
        name: 'test/test2.jpg',
        ino: 567,
        'content.sha1hex': {
          error: 'changed',
        },
        type: 'f',
        exists: true,
        new: false,
      },
    ],
  });

  client.emit('subscription', {
    files: [
      {
        name: 'test/test2.jpg',
        ino: 567,
        'content.sha1hex': 'd204',
        type: 'f',
        exists: true,
        new: false,
      },
    ],
  });

  return expect(data).resolves.toEqual([
    {
      action: 'add',
      id: 123,
      modified: null,
      type: 'folder',
      name: 'test',
      hash: null,
    },
    {
      action: 'add',
      id: 321,
      modified: null,
      type: 'file',
      name: 'test/test.jpg',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    },
    {
      action: 'add',
      id: 567,
      modified: null,
      type: 'file',
      name: 'test/test2.jpg',
      hash: 'd204',
    },
  ]);
});


test('change event', () => {
  const client = new Client();
  const stream = createStream(client, 'data');
  const data = stream.pipe(take(1)).toPromise();

  client.emit('subscription', {
    files: [
      {
        name: 'test/test.txt',
        ino: 321,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'f',
        exists: true,
        new: false,
      },
    ],
  });

  return expect(data).resolves.toEqual(
    {
      action: 'change',
      id: 321,
      modified: null,
      type: 'file',
      name: 'test/test.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    },
  );
});

test('remove event', () => {
  const client = new Client();
  const stream = createStream(client, 'data');
  const data = stream.pipe(take(1)).toPromise();

  client.emit('subscription', {
    files: [
      {
        name: 'test/test.txt',
        ino: 321,
        modified: null,
        'content.sha1hex': null,
        type: 'f',
        exists: false,
        new: false,
      },
    ],
  });

  return expect(data).resolves.toEqual(
    {
      action: 'remove',
      id: 321,
      modified: null,
      type: 'file',
      name: 'test/test.txt',
      hash: null,
    },
  );
});

test('move event', () => {
  const client = new Client();
  const stream = createStream(client, 'data');
  const data = stream.pipe(take(1)).toPromise();

  client.emit('subscription', {
    files: [
      {
        name: 'test/test.txt',
        ino: 321,
        'content.sha1hex': null,
        type: 'f',
        exists: false,
        new: false,
      },
      {
        name: 'test/test2.txt',
        ino: 321,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'f',
        exists: true,
        new: true,
      },
    ],
  });

  return expect(data).resolves.toEqual(
    {
      action: 'move',
      id: 321,
      modified: null,
      type: 'file',
      name: 'test/test2.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      oldName: 'test/test.txt',
    },
  );
});

test('copy event', () => {
  const client = new Client();
  const stream = createStream(client, 'data');
  const data = stream.pipe(take(2)).toPromise();

  client.emit('subscription', {
    files: [
      {
        name: 'test/test.txt',
        ino: 123,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'f',
        exists: true,
        new: true,
      },
    ],
  });

  client.emit('subscription', {
    files: [
      {
        name: 'test/test2.txt',
        ino: 321,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'f',
        exists: true,
        new: true,
      },
    ],
  });

  return expect(data).resolves.toEqual(
    {
      action: 'copy',
      id: 321,
      modified: null,
      type: 'file',
      name: 'test/test2.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      from: 'test/test.txt',
    },
  );
});

test('bogus file type', () => {
  const client = new Client();
  const stream = createStream(client, 'data');
  const data = stream.pipe(take(1)).toPromise();

  client.emit('subscription', {
    files: [
      {
        name: 'test/test.txt',
        ino: 321,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'l',
        exists: true,
        new: false,
      },
    ],
  });

  return expect(data).resolves.toEqual(
    {
      action: 'change',
      id: 321,
      modified: null,
      type: '',
      name: 'test/test.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    },
  );
});

test('two changes to the same file', () => {
  const client = new Client();
  const stream = createStream(client, 'data');
  const data = Promise.all([
    stream.pipe(take(1)).toPromise(),
    stream.pipe(take(2)).toPromise(),
  ]);

  client.emit('subscription', {
    files: [
      {
        name: 'test/test.txt',
        ino: 321,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'f',
        exists: true,
        new: false,
      },
      {
        name: 'test/test.txt',
        ino: 321,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'f',
        exists: true,
        new: false,
      },
    ],
  });

  return expect(data).resolves.toEqual([
    {
      action: 'change',
      id: 321,
      modified: null,
      type: 'file',
      name: 'test/test.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    },
    {
      action: 'change',
      id: 321,
      modified: null,
      type: 'file',
      name: 'test/test.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    },
  ]);
});

test('modified time returns datetime object', () => {
  const client = new Client();
  const stream = createStream(client, 'data');
  const data = stream.pipe(take(1)).toPromise();

  client.emit('subscription', {
    files: [
      {
        name: 'test/test.txt',
        ino: 321,
        'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
        type: 'f',
        exists: true,
        new: false,
        mtime_ms: 1515881917000,
      },
    ],
  });

  return data.then((event) => {
    expect(event.modified).toBeInstanceOf(DateTime);
  });
});
