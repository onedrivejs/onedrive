const { of } = require('rxjs');
const { flatMap } = require('rxjs/operators');

const separated = separator => resolved => (
  of(undefined).pipe(
    separator,
    flatMap(resolved),
  )
);

module.exports = separated;
