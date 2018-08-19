const { merge, EMPTY } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const createFolder = require('./create');
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

        return EMPTY;
      }),
    )
  )
);

module.exports = resolver;
