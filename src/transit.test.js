const { Subject } = require('rxjs');
const { share } = require('rxjs/operators');
const { checkTransit, manageTransit } = require('./transit');

test('adding cancel to transit store and checking it.', () => {
  const check = (new Subject()).pipe(checkTransit());
  const manage = (new Subject()).pipe(manageTransit());

  // Subscribe to the observables.
  check.toPromise();
  manage.toPromise();

  const name = 'test.txt';
  const cancel = jest.fn();

  manage.next({
    action: 'change',
  });

  manage.next({
    action: 'upload',
    name,
    phase: 'start',
    cancel,
  });

  check.next({
    action: 'change',
    name,
  });


  return expect(cancel).toBeCalled();
});

test('adding cancel to transit store and removing it', () => {
  const check = (new Subject()).pipe(checkTransit(), share());
  const manage = (new Subject()).pipe(manageTransit(), share());

  // Subscribe to the observables.
  check.toPromise();
  manage.toPromise();

  const name = 'test.txt';
  const cancel = jest.fn();

  manage.next({
    action: 'change',
  });

  manage.next({
    action: 'upload',
    name,
    phase: 'start',
    cancel,
  });

  manage.next({
    action: 'upload',
    name,
    phase: 'end',
  });

  check.next({
    action: 'change',
    name,
  });


  return expect(cancel).not.toBeCalled();
});
