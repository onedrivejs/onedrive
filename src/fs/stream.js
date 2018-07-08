const path = require('path');
const hasha = require('hasha');
const chokidar = require('chokidar');
const {
  Subject,
  fromEvent,
  from,
  of,
  merge,
} = require('rxjs');
const {
  filter,
  flatMap,
  delay,
  tap,
  takeUntil,
} = require('rxjs/operators');
const { Map } = require('immutable');

const stream = (directory) => {
  let store = new Map();
  const cwd = path.normalize(directory);
  const watcher = chokidar.watch('.', {
    ignored: /(^|[/\\])\../,
    cwd,
    awaitWriteFinish: true,
  });

  const add = new Subject();
  const move = new Subject();

  const fs = fromEvent(watcher, 'all').pipe(
    // Ensure that the path is not empty.
    filter(data => !!data[1]),
    flatMap(([event, p]) => {
      const hash = store.get(p);

      switch (event) {
        case 'add':
        case 'change':
          return from(hasha.fromFile(path.resolve(cwd, p), { algorithm: 'sha1' })).pipe(
            flatMap((h) => {
              // If this is a change, or if the hash does not exist in the file
              // system, send the even immdiatly.
              if (event === 'change' || !store.find(fileHash => fileHash === h)) {
                store = store.set(p, h);

                return of({
                  event,
                  path: p,
                  hash: h,
                });
              }

              // If the hash is in the store, it might be a move.
              return of({
                event,
                path: p,
                hash: h,
              }).pipe(
                // Notify any waiting unlinks.
                tap((data) => {
                  add.next(data);
                }),
                // Give the filesystem a moment to relink the file.
                delay(100),
                takeUntil(move.pipe(
                  filter(moveData => moveData.hash === h),
                )),
              );
            }),
          );
        case 'unlink':
          return of({
            event: 'delete',
            path: p,
            hash,
          }).pipe(
            // Give the filesystem a moment to relink the file.
            delay(100),
            takeUntil(add.pipe(
              filter(addData => addData.hash === hash),
              tap((addData) => {
                store = store.delete(p);

                move.next({
                  ...addData,
                  event: 'move',
                  oldPath: p,
                });
              }),
            )),
            tap((data) => {
              store = store.delete(data.path);
            }),
          );
        default:
          return of({
            event,
            path: p,
          });
      }
    }),
  );

  return merge(fs, move);
};

module.exports = stream;
