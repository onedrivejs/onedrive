const { Subject, from } = require('rxjs');
const { take } = require('rxjs/operators');
const formatAction = require('../../utils/format-action');
const createFolder = require('./create');
const move = require('./move');
const { shouldDownloadFile, downloadFile } = require('./download');
const { shouldCopyFile, copyFile } = require('./copy');
const remove = require('./remove');
const cleanTrash = require('./clean');
const resolver = require('./resolver');

jest.mock('./create');
jest.mock('./download');
jest.mock('./copy');
jest.mock('./move');
jest.mock('./remove');
jest.mock('./clean');

createFolder.mockImplementation((directory, name) => from([
  formatAction('create', 'start', 'folder', name),
  formatAction('create', 'end', 'folder', name),
]));
shouldDownloadFile.mockResolvedValue(true);
downloadFile.mockImplementation((directory, name) => formatAction('download', 'end', 'file', name));
move.mockImplementation((directory, type, name) => formatAction('move', 'end', type, name));
shouldCopyFile.mockResolvedValue(true);
copyFile.mockImplementation((directory, name) => formatAction('copy', 'end', 'file', name));
remove.mockImplementation((directory, type, name) => formatAction('remove', 'end', type, name));
cleanTrash.mockImplementation(() => formatAction('trash', 'end'));


test('resolver add folder', () => {
  const oneDriveStream = new Subject();
  const fsResolver = resolver('/data')(oneDriveStream);
  const result = Promise.all([
    fsResolver.pipe(take(1)).toPromise(),
    fsResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'create',
    type: 'folder',
    name: 'test',
  };

  oneDriveStream.next({
    action: 'test',
    type: 'file',
  });
  oneDriveStream.next({
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

test('resolver add file', () => {
  const oneDriveStream = new Subject();
  const fsResolver = resolver('/data')(oneDriveStream);
  const result = Promise.all([
    fsResolver.pipe(take(1)).toPromise(),
    fsResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'download',
    type: 'file',
    name: 'test.txt',
  };

  oneDriveStream.next({
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
  const oneDriveStream = new Subject();
  const fsResolver = resolver('/data')(oneDriveStream);
  const result = Promise.all([
    fsResolver.pipe(take(1)).toPromise(),
    fsResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'move',
    type: 'file',
    name: 'test.txt',
  };

  oneDriveStream.next(data);

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
  const oneDriveStream = new Subject();
  const fsResolver = resolver('/data')(oneDriveStream);
  const result = Promise.all([
    fsResolver.pipe(take(1)).toPromise(),
    fsResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'copy',
    type: 'file',
    name: 'test.txt',
  };

  oneDriveStream.next(data);

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

test('resolver copy file download', () => {
  // @TODO Why does this execute twice?
  shouldCopyFile.mockResolvedValueOnce(false);
  shouldCopyFile.mockResolvedValueOnce(false);
  const oneDriveStream = new Subject();
  const fsResolver = resolver('/data')(oneDriveStream);
  const result = Promise.all([
    fsResolver.pipe(take(1)).toPromise(),
    fsResolver.pipe(take(2)).toPromise(),
  ]);

  const data = {
    action: 'download',
    type: 'file',
    name: 'test3.txt',
  };

  oneDriveStream.next({
    ...data,
    action: 'copy',
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
  const oneDriveStream = new Subject();
  const fsResolver = resolver('/data')(oneDriveStream);
  const result = Promise.all([
    fsResolver.pipe(take(1)).toPromise(),
    fsResolver.pipe(take(2)).toPromise(),
    fsResolver.pipe(take(3)).toPromise(),
    fsResolver.pipe(take(4)).toPromise(),
  ]);

  const data = {
    action: 'remove',
    type: 'file',
    name: 'test.txt',
  };

  oneDriveStream.next(data);

  return expect(result).resolves.toEqual([
    {
      ...data,
      phase: 'start',
    },
    {
      ...data,
      phase: 'end',
    },
    {
      action: 'trash',
      phase: 'start',
    },
    {
      action: 'trash',
      phase: 'end',
    },
  ]);
});
