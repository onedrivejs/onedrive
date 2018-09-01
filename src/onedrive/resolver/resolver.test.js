const { Subject, from } = require('rxjs');
const { take } = require('rxjs/operators');
const { formatAction } = require('../../utils/format-action');
const createFolder = require('./create');
const uploadFile = require('./upload');
const move = require('./move');
const resolver = require('./resolver');

jest.mock('./create');
jest.mock('./upload');
jest.mock('./move');

createFolder.mockImplementation((refreshToken, name) => from([
  formatAction('create', 'start', 'folder', name),
  formatAction('create', 'end', 'folder', name),
]));

uploadFile.mockImplementation((directory, refreshToken, name) => from([
  formatAction('upload', 'start', 'file', name),
  formatAction('upload', 'end', 'file', name),
]));

move.mockImplementation((refreshToken, type, name) => from([
  formatAction('move', 'start', type, name),
  formatAction('move', 'end', type, name),
]));

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

test('resolver upload file', () => {
  const fsStream = new Subject();
  const oneDriveResolver = resolver('abcd')(fsStream);
  const result = Promise.all([
    oneDriveResolver.pipe(take(1)).toPromise(),
    oneDriveResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'upload',
    type: 'file',
    name: 'test.txt',
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

test('resolver move file', () => {
  const fsStream = new Subject();
  const oneDriveResolver = resolver('abcd')(fsStream);
  const result = Promise.all([
    oneDriveResolver.pipe(take(1)).toPromise(),
    oneDriveResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'move',
    type: 'file',
    name: 'test.txt',
  };

  fsStream.next({
    action: 'test',
    type: 'file',
  });
  fsStream.next({
    ...data,
    action: 'move',
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
