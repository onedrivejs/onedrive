const EventEmitter = require('events');
const chokidar = require('chokidar');
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
  expect.assertions(1);
  return new Promise((resolve) => {
    createStream('data').subscribe((data) => {
      expect(data).toEqual({
        event: 'test',
        path: 'what/what.jpg',
      });
      resolve(data);
    });

    watcher.emit('all', 'test', 'what/what.jpg');
  });
});
