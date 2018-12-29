const { share, take } = require('rxjs/operators');
const createWorkSubject = require('./work');

test('work subject', () => {
  const work = createWorkSubject(2).pipe(share());

  const result = work.pipe(take(5)).toPromise();

  // Emit!
  work.next('start'); // Emit!
  work.next('end');
  work.next('start'); // Emit!
  work.next('start');
  work.next('end'); // Emit!
  work.next('start');
  work.next('end'); // Emit!

  return expect(result).resolves.toEqual(undefined);
});
