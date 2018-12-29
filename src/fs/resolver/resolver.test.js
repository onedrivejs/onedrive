const { Subject, BehaviorSubject, merge } = require('rxjs');
const { take, share } = require('rxjs/operators');
const { formatAction } = require('../../utils/format-action');
const createFolder = require('./create');
const moveDownload = require('./move-download');
const downloadFile = require('./download');
const copyDownloadFile = require('./copy-download');
const remove = require('./remove');
const cleanTrash = require('./clean');
const resolver = require('./resolver');
const createWorkerSubject = require('../../work');

jest.mock('./create');
jest.mock('./download');
jest.mock('./move-download');
jest.mock('./remove');
jest.mock('./clean');
jest.mock('./copy-download');
jest.mock('../../work');

createWorkerSubject.mockImplementation(() => new BehaviorSubject(undefined));

createFolder.mockImplementation((directory, name) => merge(
  formatAction('create', 'start', 'folder', name),
  formatAction('create', 'end', 'folder', name),
));
downloadFile.mockImplementation((directory, name) => merge(
  formatAction('download', 'start', 'file', name),
  formatAction('download', 'end', 'file', name),
));
moveDownload.mockImplementation((directory, type, name) => merge(
  formatAction('move', 'start', type, name),
  formatAction('move', 'end', type, name),
));
copyDownloadFile.mockImplementation((directory, name) => merge(
  formatAction('copy', 'start', 'file', name),
  formatAction('copy', 'end', 'file', name),
));
remove.mockImplementation((directory, type, name) => merge(
  formatAction('remove', 'start', type, name),
  formatAction('remove', 'end', type, name),
));
cleanTrash.mockImplementation(() => merge(
  formatAction('trash', 'start'),
  formatAction('trash', 'end'),
));

test('resolver add folder', () => {
  const oneDriveStream = new Subject();
  const fsResolver = resolver('/data')(oneDriveStream).pipe(share());
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
  const fsResolver = resolver('/data')(oneDriveStream).pipe(share());
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
  const fsResolver = resolver('/data')(oneDriveStream).pipe(share());
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
  const fsResolver = resolver('/data')(oneDriveStream).pipe(share());
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
  copyDownloadFile.mockImplementationOnce((directory, name) => merge(
    formatAction('download', 'start', 'file', name),
    formatAction('download', 'end', 'file', name),
  ));
  const oneDriveStream = new Subject();
  const fsResolver = resolver('/data')(oneDriveStream).pipe(share());
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
  const fsResolver = resolver('/data')(oneDriveStream).pipe(share());
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
