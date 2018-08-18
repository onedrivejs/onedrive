const {
  merge,
  from,
  of,
  EMPTY,
  Subject,
} = require('rxjs');
const {
  flatMap,
  map,
  filter,
  debounceTime,
} = require('rxjs/operators');
const formatAction = require('../../utils/format-action');
const createFolder = require('./create');
const { shouldDownloadFile, downloadFile } = require('./download');
const { shouldCopyFile, copyFile } = require('./copy');
const move = require('./move');
const remove = require('./remove');
const cleanTrash = require('./clean');

const resolver = (directory, oneDriveStream) => {
  // The trash does not need to be cleaned all the time. Slow it down with a
  // debounce.
  const clean = (new Subject()).pipe(
    debounceTime(1000),
    flatMap(() => merge(
      of({
        action: 'trash',
        phase: 'start',
      }),
      cleanTrash(directory),
    )),
  );

  const resolved = oneDriveStream.pipe(
    flatMap((data) => {
      // Empty folders should be added.
      if (data.action === 'add' && data.type === 'folder') {
        return merge(
          formatAction('create', 'start', data.type, data.name),
          createFolder(directory, data.name),
        );
      }

      // Download files that have been added or changed.
      if (['add', 'change'].includes(data.action) && data.type === 'file') {
        return from(shouldDownloadFile(directory, data.name, data.hash, data.modified)).pipe(
          filter(should => !!should),
          flatMap(() => (
            merge(
              formatAction('download', 'start', data.type, data.name),
              downloadFile(directory, data.name, data.modified, data.downloadUrl),
            )
          )),
        );
      }

      // Anything can be moved.
      if (data.action === 'move') {
        return merge(
          formatAction('move', 'start', data.type, data.name),
          move(directory, data.type, data.name, data.oldName),
        );
      }

      // If a directory is copied, all of the files in that directory are copied
      // as well. We'll skip the folder copy and wait for each file to be
      // copied.
      if (data.action === 'copy' && data.type === 'file') {
        return from(shouldCopyFile(directory, data.from, data.hash)).pipe(
          flatMap((shouldCopy) => {
            if (shouldCopy) {
              return merge(
                formatAction('copy', 'start', data.type, data.name),
                copyFile(directory, data.name, data.from),
              );
            }

            return merge(
              formatAction('download', 'start', data.type, data.name),
              downloadFile(directory, data.name, data.modified, data.downloadUrl),
            );
          }),
        );
      }

      // Anything can be removed, but it may no longer exist if the parent
      // was removed.
      if (data.action === 'remove') {
        return merge(
          formatAction('remove', 'start', data.type, data.name),
          from(remove(directory, data.type, data.name)).pipe(
            map((value) => {
              // After the file remove is done, clean the trash.
              clean.next(value);
              return value;
            }),
          ),
        );
      }

      return EMPTY;
    }),
    filter(item => !!item),
  );

  return merge(resolved, clean);
};

module.exports = resolver;
