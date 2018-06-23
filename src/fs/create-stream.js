const path = require('path');
const hasha = require('hasha');
const { fromEvent, of } = require('rxjs');
const { flatMap } = require('rxjs/operators');

const createStream = watcher => (
  fromEvent(watcher, 'all').pipe(
    flatMap(([event, p]) => {
      switch (event) {
        case 'add':
          return hasha.fromFile(path.resolve(watcher.options.cwd, p), { algorithm: 'sha1' }).then(hash => (
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
  )
);

module.exports = createStream;
