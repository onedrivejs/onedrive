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

test('sends a test event through the stream', () => {
  const client = new Client();
  const data = createStream('data').pipe(take(1)).toPromise();

  client.emit('subscription', 'test', '');
  client.emit('subscription', 'test', 'what/what.jpg');

  return expect(data).resolves.toEqual({
    event: 'test',
    path: 'what/what.jpg',
  });
});

test('sends an add event through the stream', () => {
  const client = new Client();
  const data = createStream('data').pipe(take(1)).toPromise();

  client.emit('subscription', 'add', 'what/what.jpg');

  return expect(data).resolves.toEqual({
    event: 'add',
    path: 'what/what.jpg',
    hash: 'abcdef',
  });
});

test('sends a change event through the stream', () => {
  const client = new Client();
  const data = createStream('data').pipe(take(1)).toPromise();

  client.emit('subscription', 'change', 'what/what.jpg');

  return expect(data).resolves.toEqual({
    event: 'change',
    path: 'what/what.jpg',
    hash: 'abcdef',
  });
});

test('sends a move event through the stream', () => {
  const client = new Client();
  const data = createStream('data').pipe(take(2)).toPromise();

  // Init.
  client.emit('subscription', 'add', 'what/what.jpg');
  // At somepoint in the future.
  setTimeout(() => {
    client.emit('subscription', 'unlink', 'what/what.jpg');
    client.emit('subscription', 'add', 'what/what2.jpg');
  }, 200);

  return expect(data).resolves.toEqual({
    event: 'move',
    path: 'what/what2.jpg',
    oldPath: 'what/what.jpg',
    hash: 'abcdef',
  });
});

test('sends a delete event through the stream', () => {
  const client = new Client();
  const data = createStream('data').pipe(take(2)).toPromise();

  // Init.
  client.emit('subscription', 'add', 'what/what.jpg');
  // At somepoint in the future.
  setTimeout(() => {
    client.emit('subscription', 'unlink', 'what/what.jpg');
  }, 200);

  return expect(data).resolves.toEqual({
    event: 'delete',
    path: 'what/what.jpg',
    hash: 'abcdef',
  });
});
