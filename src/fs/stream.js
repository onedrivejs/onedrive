const path = require('path');
const { Client } = require('fb-watchman');
const {
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
  map,
  takeUntil,
} = require('rxjs/operators');

const client = new Client();

const stream = (directory) => {
  client.command(['subscribe', directory, 'onedrive', {
    expression: ['not', ['match', '.*']],
    fields: ['name', 'ino', 'content.sha1hex', 'type', 'exists', 'new'],
  }], (error) => {
    if (error) {
      // Probably an error in the subscription criteria
      console.error('failed to subscribe: ', error);
    }
  });

  // Normalize filesystem events.
  return fromEvent(client, 'subscription').pipe(
    flatMap((resp) => {
      return of(resp);
    }),
    // flatMap(([event, p]) => {
    //   switch (event) {
    //     case 'add':
    //     case 'change':
    //       return from(hasha.fromFile(path.resolve(cwd, p), { algorithm: 'sha1' })).pipe(
    //         map(h => ({
    //           event,
    //           path: p,
    //           hash: h,
    //         })),
    //       );
    //     case 'unlink':
    //       return of({
    //         event: 'delete',
    //         path: p,
    //         hash: store.get(p),
    //       });
    //     default:
    //       return of({
    //         event,
    //         path: p,
    //       });
    //   }
    // }),
  );

  // Merge add & delete action into move.
  // return merge(fs, move).pipe(
  //   flatMap((data) => {
  //     switch (data.event) {
  //       case 'change':
  //         store = store.set(data.path, data.hash);
  //         return of(data);
  //       // @TODO Use groupByUntil operator instead of this nonsense.
  //       case 'add':
  //         return of(data).pipe(
  //           flatMap((h) => {
  //             // If this is a change, or if the hash does not exist in the file
  //             // system, send the even immdiatly.
  //             if (!store.find(fileHash => fileHash === data.hash)) {
  //               store = store.set(data.path, data.hash);
  //               return of(data);
  //             }
  //
  //             // Notify any waiting unlinks.
  //             add.next(data);
  //
  //             // If the hash is in the store, it might be a move.
  //             return of(data).pipe(
  //               // Give the filesystem a moment to relink the file.
  //               delay(100),
  //               takeUntil(move.pipe(
  //                 filter(moveData => moveData.hash === h),
  //               )),
  //             );
  //           }),
  //         );
  //       case 'delete':
  //         return of(data).pipe(
  //           // Give the filesystem a moment to relink the file.
  //           delay(100),
  //           takeUntil(add.pipe(
  //             filter(addData => addData.hash === data.hash),
  //             tap((addData) => {
  //               store = store.delete(data.path);
  //
  //               move.next({
  //                 ...addData,
  //                 event: 'move',
  //                 oldPath: data.path,
  //               });
  //             }),
  //           )),
  //           tap((d) => {
  //             store = store.delete(d.path);
  //           }),
  //         );
  //       default:
  //         return of(data);
  //     }
  //   }),
  // );
};

module.exports = stream;
