const path = require('path');
const chokidar = require('chokidar');

const createWatcher = directory => (
  chokidar.watch('.', {
    ignored: /(^|[/\\])\../,
    cwd: path.normalize(directory),
    awaitWriteFinish: true,
  })
);

module.exports = createWatcher;
