const { Subject, from } = require('rxjs');
const { take, share } = require('rxjs/operators');
const { formatAction } = require('../../utils/format-action');
const createFolder = require('./create');
const uploadFile = require('./upload');
const moveUpload = require('./move-upload');
const resolver = require('./resolver');
const copyUploadFile = require('./copy-upload');
const remove = require('./remove');

jest.mock('./create');
jest.mock('./upload');
jest.mock('./move-upload');
jest.mock('./copy-upload');
jest.mock('./remove');
jest.mock('../../separator', () => () => jest.fn(stream => stream));

const content = jest.fn();

createFolder.mockImplementation((refreshToken, name) => from([
  formatAction('create', 'start', 'folder', name),
  formatAction('create', 'end', 'folder', name),
]));

uploadFile.mockImplementation((refreshToken, name) => from([
  formatAction('upload', 'start', 'file', name),
  formatAction('upload', 'end', 'file', name),
]));

moveUpload.mockImplementation((refreshToken, type, name) => from([
  formatAction('move', 'start', type, name),
  formatAction('move', 'end', type, name),
]));

copyUploadFile.mockImplementation((refreshToken, name) => from([
  formatAction('copy', 'start', 'file', name),
  formatAction('copy', 'end', 'file', name),
]));

remove.mockImplementation((refreshToken, type, name) => from([
  formatAction('remove', 'start', type, name),
  formatAction('remove', 'end', type, name),
]));

test('resolver add folder', () => {
  const fsStream = new Subject();
  const oneDriveResolver = resolver('abcd')(fsStream).pipe(share());
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
    content,
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
  const oneDriveResolver = resolver('abcd')(fsStream).pipe(share());
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
    content,
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
  const oneDriveResolver = resolver('abcd')(fsStream).pipe(share());
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
    content,
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

test('resolver copy file', () => {
  const fsStream = new Subject();
  const oneDriveResolver = resolver('abcd')(fsStream).pipe(share());
  const result = Promise.all([
    oneDriveResolver.pipe(take(1)).toPromise(),
    oneDriveResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'copy',
    type: 'file',
    name: 'test.txt',
  };

  fsStream.next({
    action: 'test',
    type: 'file',
  });
  fsStream.next({
    ...data,
    content,
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

test('resolver remove file', () => {
  const fsStream = new Subject();
  const oneDriveResolver = resolver('abcd')(fsStream).pipe(share());
  const result = Promise.all([
    oneDriveResolver.pipe(take(1)).toPromise(),
    oneDriveResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'remove',
    type: 'file',
    name: 'test.txt',
  };

  fsStream.next({
    action: 'test',
    type: 'file',
  });
  fsStream.next({
    ...data,
    content,
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
