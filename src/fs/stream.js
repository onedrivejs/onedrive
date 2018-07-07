const path = require('path');
const hasha = require('hasha');
const chokidar = require('chokidar');
const { fromEvent, of } = require('rxjs');
const { filter, flatMap } = require('rxjs/operators');

const stream = (directory) => {
  const cwd = path.normalize(directory);
  const watcher = chokidar.watch('.', {
    ignored: /(^|[/\\])\../,
    cwd,
    awaitWriteFinish: true,
  });

  return fromEvent(watcher, 'all').pipe(
    // Ensure that the path is not empty.
    filter(data => !!data[1]),
    flatMap(([event, p]) => {
      switch (event) {
        case 'add':
          return hasha.fromFile(path.resolve(cwd, p), { algorithm: 'sha1' }).then(hash => (
            {
              event,
              path: p,
              hash,
            }
          ));
        default:
          return of({
            event,
            path: p,
          });
      }
    }),
  );
};

module.exports = stream;
