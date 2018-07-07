const EventEmitter = require('events');
const chokidar = require('chokidar');
const { take } = require('rxjs/operators');
const createStream = require('./stream');

jest.mock('chokidar');

const watcher = new EventEmitter();
watcher.options = {
  cwd: 'data',
};

chokidar.watch = jest.fn(() => watcher);

test('creates a filesystem stream', () => {
  const stream = createStream('data');

  expect(stream).toBeDefined();
});

test('sends a test event through the stream', () => {
  const data = createStream('data').pipe(take(1)).toPromise();

  watcher.emit('all', 'test', '');
  watcher.emit('all', 'test', 'what/what.jpg');

  return expect(data).resolves.toEqual({
    event: 'test',
    path: 'what/what.jpg',
  });
});
