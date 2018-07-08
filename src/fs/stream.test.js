const EventEmitter = require('events');
const chokidar = require('chokidar');
const hasha = require('hasha');
const { take } = require('rxjs/operators');
const createStream = require('./stream');

jest.mock('chokidar');
jest.mock('hasha');

hasha.fromFile = jest.fn(() => Promise.resolve('abcdef'));

test('creates a filesystem stream', () => {
  const stream = createStream('data');

  expect(stream).toBeDefined();
});

test('sends a test event through the stream', () => {
  const watcher = new EventEmitter();
  chokidar.watch = jest.fn(() => watcher);

  const data = createStream('data').pipe(take(1)).toPromise();

  watcher.emit('all', 'test', '');
  watcher.emit('all', 'test', 'what/what.jpg');

  return expect(data).resolves.toEqual({
    event: 'test',
    path: 'what/what.jpg',
  });
});

test('sends an add event through the stream', () => {
  const watcher = new EventEmitter();
  chokidar.watch = jest.fn(() => watcher);

  const data = createStream('data').pipe(take(1)).toPromise();

  watcher.emit('all', 'add', 'what/what.jpg');

  return expect(data).resolves.toEqual({
    event: 'add',
    path: 'what/what.jpg',
    hash: 'abcdef',
  });
});

test('sends a change event through the stream', () => {
  const watcher = new EventEmitter();
  chokidar.watch = jest.fn(() => watcher);

  const data = createStream('data').pipe(take(1)).toPromise();

  watcher.emit('all', 'change', 'what/what.jpg');

  return expect(data).resolves.toEqual({
    event: 'change',
    path: 'what/what.jpg',
    hash: 'abcdef',
  });
});

test('sends a move event through the stream', () => {
  const watcher = new EventEmitter();
  chokidar.watch = jest.fn(() => watcher);

  const data = createStream('data').pipe(take(2)).toPromise();

  // Init.
  watcher.emit('all', 'add', 'what/what.jpg');
  // At somepoint in the future.
  setTimeout(() => {
    watcher.emit('all', 'unlink', 'what/what.jpg');
    watcher.emit('all', 'add', 'what/what2.jpg');
  }, 200);

  return expect(data).resolves.toEqual({
    event: 'move',
    path: 'what/what2.jpg',
    oldPath: 'what/what.jpg',
    hash: 'abcdef',
  });
});

test('sends a delete event through the stream', () => {
  const watcher = new EventEmitter();
  chokidar.watch = jest.fn(() => watcher);

  const data = createStream('data').pipe(take(2)).toPromise();

  // Init.
  watcher.emit('all', 'add', 'what/what.jpg');
  // At somepoint in the future.
  setTimeout(() => {
    watcher.emit('all', 'unlink', 'what/what.jpg');
  }, 200);

  return expect(data).resolves.toEqual({
    event: 'delete',
    path: 'what/what.jpg',
    hash: 'abcdef',
  });
});
