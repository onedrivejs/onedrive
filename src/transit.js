const { tap } = require('rxjs/operators');

const transit = new Map();

const checkTransit = () => stream => (
  stream.pipe(
    tap(({ action, name, oldName }) => {
      if (['change', 'move', 'remove'].includes(action) && transit.has(oldName || name)) {
        const cancel = transit.get(oldName || name);
        cancel();
        transit.delete(name);
      }
    }),
  )
);

const addTransit = () => stream => (
  stream.pipe(
    tap(({ name, cancel }) => {
      if (cancel) {
        transit.set(name, cancel);
      }
    }),
  )
);

module.exports = { checkTransit, addTransit };
