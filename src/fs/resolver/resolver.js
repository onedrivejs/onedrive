const {
  merge,
  EMPTY,
  Subject,
} = require('rxjs');
const {
  flatMap,
  map,
  debounceTime,
} = require('rxjs/operators');
const createFolder = require('./create');
const downloadFile = require('./download');
const copyDownloadFile = require('./copy-download');
const moveDownload = require('./move-download');
const remove = require('./remove');
const cleanTrash = require('./clean');

const concurrency = 3;

function resolver(directory) {
  // The trash does not need to be cleaned all the time. Slow it down with a
  // debounce.
  const clean = (new Subject()).pipe(
    debounceTime(1000),
    flatMap(() => cleanTrash(directory)),
  );

  return (oneDriveStream) => {
    const resolved = oneDriveStream.pipe(
      flatMap((data) => {
        // Empty folders should be added.
        if (data.action === 'add' && data.type === 'folder') {
          return createFolder(directory, data.name);
        }

        // Download files that have been added or changed.
        if (['add', 'change'].includes(data.action) && data.type === 'file') {
          return downloadFile(directory, data.name, data.hash, data.modified, data.download);
        }

        // Anything can be moved.
        if (data.action === 'move') {
          return moveDownload(
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
          return copyDownloadFile(
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
          return remove(directory, data.type, data.name).pipe(
            map((value) => {
              // After the file remove is done, clean the trash.
              clean.next(value);
              return value;
            }),
          );
        }

        return EMPTY;
      }, undefined, concurrency),
    );

    return merge(resolved, clean);
  };
}

module.exports = resolver;
