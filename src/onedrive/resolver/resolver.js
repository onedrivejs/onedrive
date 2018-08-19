const { merge, from, EMPTY } = require('rxjs');
const { flatMap, filter } = require('rxjs/operators');
const createFolder = require('./create');
// const { shouldUploadFile, uploadFile } = require('./upload');
const formatAction = require('../../utils/format-action');

const resolver = refreshToken => (
  fsStream => (
    fsStream.pipe(
      flatMap((data) => {
        if (data.action === 'add' && data.type === 'folder') {
          return merge(
            formatAction('create', 'start', data.type, data.name),
            createFolder(refreshToken, data.name),
          );
        }

        // Upload files that have been added or changed.
        // if (['add', 'change'].includes(data.action) && data.type === 'file') {
        //   return from(shouldUploadFile(refreshToken, data.name, data.hash, data.modified)).pipe(
        //     filter(should => !!should),
        //     flatMap(() => (
        //       merge(
        //         formatAction('upload', 'start', data.type, data.name),
        //         uploadFile(refreshToken, data.name, data.modified, data.downloadUrl),
        //       )
        //     )),
        //   );
        // }

        return EMPTY;
      }),
    )
  )
);

module.exports = resolver;
