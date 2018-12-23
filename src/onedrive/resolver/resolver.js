const { EMPTY } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const createSeparator = require('../../separator');
const createSeparated = require('../../separated');
const createFolder = require('./create');
const uploadFile = require('./upload');
const moveUpload = require('./move-upload');
const copyUploadFile = require('./copy-upload');
const remove = require('./remove');

const separated = createSeparated(createSeparator());

const resolver = refreshToken => (
  fsStream => (
    fsStream.pipe(
      flatMap((data) => {
        if (data.action === 'add' && data.type === 'folder') {
          return separated(() => createFolder(refreshToken, data.name));
        }

        // Upload files that have been added or changed.
        if (data.type === 'file' && ['add', 'change'].includes(data.action)) {
          return separated(() => uploadFile(
            refreshToken,
            data.name,
            data.hash,
            data.modified,
            data.size,
            data.content,
          ));
        }

        if (data.action === 'move') {
          return separated(() => moveUpload(
            refreshToken,
            data.type,
            data.name,
            data.hash,
            data.modified,
            data.size,
            data.content,
            data.oldName,
          ));
        }

        // If a directory is copied, all of the files in that directory are
        // copied as well. We'll skip the folder copy and wait for each file to
        // be copied.
        if (data.type === 'file' && data.action === 'copy') {
          return separated(() => copyUploadFile(
            refreshToken,
            data.name,
            data.hash,
            data.modified,
            data.size,
            data.content,
            data.from,
          ));
        }

        // Anything can be removed, but it may no longer exist if the parent
        // was removed.
        if (data.action === 'remove') {
          return separated(() => remove(refreshToken, data.type, data.name));
        }

        return EMPTY;
      }),
    )
  )
);

module.exports = resolver;
