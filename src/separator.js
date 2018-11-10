const { interval, of } = require('rxjs');
const { delayWhen, first } = require('rxjs/operators');

const separator = (sep = 1000) => {
  let time = 0;

  return stream => (
    stream.pipe(
      delayWhen(() => {
        // If the wait time is less than the current time,
        // then move the time to the next interval and let
        // the item pass through.
        if (time < Date.now()) {
          time = Date.now() + sep;
          return of(0);
        }

        time += sep;
        return interval(time - Date.now()).pipe(first());
      }),
    )
  );
};

module.exports = separator;
