const { EMPTY } = require('rxjs');
const { flatMap, tap, zip } = require('rxjs/operators');
const createWorkSubject = require('../../work');
const createFolder = require('./create');
const uploadFile = require('./upload');
const moveUpload = require('./move-upload');
const copyUploadFile = require('./copy-upload');
const remove = require('./remove');

const resolver = (refreshToken) => {
  const work = createWorkSubject(3);

  return fsStream => (
    fsStream.pipe(
      zip(work, data => data),
      flatMap((data) => {
        work.next('start');

        let response = EMPTY;

        if (data.action === 'add' && data.type === 'folder') {
          response = createFolder(refreshToken, data.name);
        }

        // Upload files that have been added or changed.
        if (data.type === 'file' && ['add', 'change'].includes(data.action)) {
          response = uploadFile(
            refreshToken,
            data.name,
            data.hash,
            data.modified,
            data.size,
            data.content,
          );
        }

        if (data.action === 'move') {
          response = moveUpload(
            refreshToken,
            data.type,
            data.name,
            data.hash,
            data.modified,
            data.size,
            data.content,
            data.oldName,
          );
        }

        // If a directory is copied, all of the files in that directory are
        // copied as well. We'll skip the folder copy and wait for each file to
        // be copied.
        if (data.type === 'file' && data.action === 'copy') {
          response = copyUploadFile(
            refreshToken,
            data.name,
            data.hash,
            data.modified,
            data.size,
            data.content,
            data.from,
          );
        }

        // Anything can be removed, but it may no longer exist if the parent
        // was removed.
        if (data.action === 'remove') {
          response = remove(refreshToken, data.type, data.name);
        }

        return response.pipe(
          tap(undefined, undefined, () => {
            work.next('end');
          }),
        );
      }),
    )
  );
};

module.exports = resolver;
