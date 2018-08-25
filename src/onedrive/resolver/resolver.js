const { EMPTY } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const createFolder = require('./create');
const { uploadFile } = require('./upload');

const resolver = (directory, refreshToken) => (
  fsStream => (
    fsStream.pipe(
      flatMap((data) => {
        if (data.action === 'add' && data.type === 'folder') {
          return createFolder(refreshToken, data.name);
        }

        // Upload files that have been added or changed.
        if (data.type === 'file' && ['add', 'change'].includes(data.action)) {
          return uploadFile(
            directory,
            refreshToken,
            data.name,
            data.hash,
            data.modified,
            data.size,
          );
        }

        return EMPTY;
      }),
    )
  )
);

module.exports = resolver;
