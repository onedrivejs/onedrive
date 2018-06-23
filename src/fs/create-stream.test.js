const EventEmitter = require('events');
const createStream = require('./create-stream');

test('creates a filesystem stream', () => {
  const watcher = new EventEmitter();
  watcher.options = {
    cwd: 'data',
  };

  const stream = createStream(watcher);

  expect(stream).toBeDefined();
});

test('sends a test event through the stream', () => {
  const watcher = new EventEmitter();
  watcher.options = {
    cwd: 'data',
  };

  expect.assertions(1);
  return new Promise((resolve) => {
    createStream(watcher).subscribe((data) => {
      expect(data).toEqual({
        event: 'test',
        path: 'what/what.jpg',
      });
      resolve(data);
    });

    watcher.emit('all', 'test', 'what/what.jpg');
  });
});
