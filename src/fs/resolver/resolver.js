const {
  merge,
  EMPTY,
  Subject,
} = require('rxjs');
const {
  flatMap,
  map,
  debounceTime,
  tap,
  zip,
} = require('rxjs/operators');
const createWorkSubject = require('../../work');
const createFolder = require('./create');
const downloadFile = require('./download');
const copyDownloadFile = require('./copy-download');
const moveDownload = require('./move-download');
const remove = require('./remove');
const cleanTrash = require('./clean');

const resolver = (directory) => {
  // The trash does not need to be cleaned all the time. Slow it down with a
  // debounce.
  const clean = (new Subject()).pipe(
    debounceTime(1000),
    flatMap(() => cleanTrash(directory)),
  );

  const work = createWorkSubject(3);

  return (oneDriveStream) => {
    const resolved = oneDriveStream.pipe(
      zip(work, data => data),
      flatMap((data) => {
        work.next('start');

        let response = EMPTY;

        // Empty folders should be added.
        if (data.action === 'add' && data.type === 'folder') {
          response = createFolder(directory, data.name);
        }

        // Download files that have been added or changed.
        if (['add', 'change'].includes(data.action) && data.type === 'file') {
          response = downloadFile(directory, data.name, data.hash, data.modified, data.download);
        }

        // Anything can be moved.
        if (data.action === 'move') {
          response = moveDownload(
            directory,
            data.type,
            data.name,
            data.modified,
            data.hash,
            data.oldName,
            data.download,
          );
        }

        // If a directory is copied, all of the files in that directory are copied
        // as well. We'll skip the folder copy and wait for each file to be
        // copied.
        if (data.action === 'copy' && data.type === 'file') {
          response = copyDownloadFile(
            directory,
            data.name,
            data.modified,
            data.hash,
            data.from,
            data.download,
          );
        }

        // Anything can be removed, but it may no longer exist if the parent
        // was removed.
        if (data.action === 'remove') {
          response = remove(directory, data.type, data.name).pipe(
            map((value) => {
              // After the file remove is done, clean the trash.
              clean.next(value);
              return value;
            }),
          );
        }

        return response.pipe(
          tap(undefined, undefined, () => {
            work.next('end');
          }),
        );
      }),
    );

    return merge(resolved, clean);
  };
};

module.exports = resolver;
