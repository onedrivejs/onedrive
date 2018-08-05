const {
  merge,
  empty,
  from,
  of,
} = require('rxjs');
const { flatMap, filter } = require('rxjs/operators');
const formatAction = require('./format');
const createFolder = require('./create');
const { shouldDownloadFile, downloadFile } = require('./download');
const { shouldCopyFile, copyFile } = require('./copy');
const moveFile = require('./move');
const removeFile = require('./remove');
const cleanTrash = require('./clean');

const resolver = (directory, oneDriveStream) => (
  oneDriveStream.pipe(
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

      if (data.action === 'move' && data.type === 'file') {
        return merge(
          formatAction('move', 'start', data.type, data.name),
          moveFile(directory, data.name, data.oldName),
        );
      }

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

      if (data.action === 'remove' && data.type === 'file') {
        return merge(
          formatAction('remove', 'start', data.type, data.name),
          from(removeFile(directory, data.name)).pipe(
            // After the file remove is done, clean the trash.
            flatMap(() => (
              merge(
                of({
                  action: 'trash',
                  phase: 'start',
                }),
                cleanTrash(directory),
              )
            )),
          ),
        );
      }

      return empty();
    }),
    filter(item => !!item),
  )
);

module.exports = resolver;
