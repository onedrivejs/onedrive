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

const manageTransit = () => stream => (
  stream.pipe(
    tap(({
      action,
      name,
      cancel,
      phase,
    }) => {
      if (!['upload', 'download'].includes(action)) {
        return;
      }

      if (phase === 'start' && cancel) {
        transit.set(name, cancel);
      }

      if (phase === 'end' && transit.has(name)) {
        transit.delete(name);
      }
    }),
  )
);

module.exports = { checkTransit, manageTransit };
