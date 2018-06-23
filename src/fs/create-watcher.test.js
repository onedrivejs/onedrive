const chokidar = require('chokidar');
const createWatcher = require('./create-watcher');

jest.mock('chokidar');

test('creates a filesystem watcher', () => {
  chokidar.watch = jest.fn();
  createWatcher('./data');

  expect(chokidar.watch).toBeCalled();
});
