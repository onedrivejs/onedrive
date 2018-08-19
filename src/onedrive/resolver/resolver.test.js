const { Subject } = require('rxjs');
const { take } = require('rxjs/operators');
const formatAction = require('../../utils/format-action');
const createFolder = require('./create');
const resolver = require('./resolver');

jest.mock('./create');

createFolder.mockImplementation((refreshToken, name) => formatAction('create', 'end', 'folder', name));

test('resolver add folder', () => {
  const fsStream = new Subject();
  const oneDriveResolver = resolver('abcd')(fsStream);
  const result = Promise.all([
    oneDriveResolver.pipe(take(1)).toPromise(),
    oneDriveResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'create',
    type: 'folder',
    name: 'test',
  };

  fsStream.next({
    action: 'test',
    type: 'file',
  });
  fsStream.next({
    ...data,
    action: 'add',
  });

  return expect(result).resolves.toEqual([
    {
      ...data,
      phase: 'start',
    },
    {
      ...data,
      phase: 'end',
    },
  ]);
});
