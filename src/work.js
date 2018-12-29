const { BehaviorSubject, of, EMPTY } = require('rxjs');
const { flatMap } = require('rxjs/operators');

const workSubject = (max) => {
  let i = 0;
  const subject = new BehaviorSubject(undefined);

  return subject.pipe(
    flatMap((value) => {
      // The initial value is undefined.
      if (value === undefined) {
        return of(undefined);
      }

      if (value === 'start') {
        i += 1;
        // If we are less than the max, request another item.
        if (i < max) {
          return of(undefined);
        }
      }

      if (value === 'end') {
        i -= 1;
        // If we are backing off of the max, request another item.
        if (i === max - 1) {
          return of(undefined);
        }
      }

      return EMPTY;
    }),
  );
};

module.exports = workSubject;
