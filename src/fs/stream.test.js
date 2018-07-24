const { Client } = require('fb-watchman');
const { take } = require('rxjs/operators');
const createStream = require('./stream');

// Hoisted to the top of the file.
jest.mock('fb-watchman', () => {
  const EventEmitter = require('events');
  const mockClient = new EventEmitter();
  mockClient.command = jest.fn();

  return {
    Client: function() {
      return mockClient;
    },
  };
});

test('creates a filesystem stream', () => {
  const stream = createStream('data');

  expect(stream).toBeDefined();
});

test('sends an add event through the stream', () => {
  const client = new Client();
  const stream = createStream('data');

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
          error: 'changed'
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
      type: 'folder',
      name: 'test',
      hash: null,
    },
    {
      action: 'add',
      id: 321,
      type: 'file',
      name: 'test/test.jpg',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    },
    {
      action: 'add',
      id: 567,
      type: 'file',
      name: 'test/test2.jpg',
      hash: 'd204',
    },
  ]);
});

//
test('sends a change event through the stream', () => {
  const client = new Client();
  const stream = createStream('data');
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
      type: 'file',
      name: 'test/test.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
    },
  );
});

test('sends a remove event through the stream', () => {
  const client = new Client();
  const stream = createStream('data');
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
    ],
  });

  return expect(data).resolves.toEqual(
    {
      action: 'remove',
      id: 321,
      type: 'file',
      name: 'test/test.txt',
      hash: null,
    },
  );
});

test('sends a move event through the stream', () => {
  const client = new Client();
  const stream = createStream('data');
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
      type: 'file',
      name: 'test/test2.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      oldName: 'test/test.txt',
    },
  );
});

test('sends a copy event through the stream', () => {
  const client = new Client();
  const stream = createStream('data');
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
      type: 'file',
      name: 'test/test2.txt',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      from: 'test/test.txt',
    },
  );
});
