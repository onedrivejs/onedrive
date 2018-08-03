const { map } = require('rxjs/operators');
const { DateTime } = require('luxon');
const { join } = require('path');
const { Map } = require('immutable');
const delta = require('./delta');

const formatAction = (action, file, name, hash) => {
  let type;
  if ('file' in file) {
    type = 'file';
  } else if ('folder' in file) {
    type = 'folder';
  } else {
    throw new Error('Unhandled item type');
  }

  return {
    action,
    id: file.id,
    type,
    name,
    modified: file.lastModifiedDateTime ? DateTime.fromISO(file.lastModifiedDateTime) : null,
    hash,
    downloadUrl: file['@microsoft.graph.downloadUrl'] ? file['@microsoft.graph.downloadUrl'] : null,
  };
};

const stream = (refreshToken) => {
  let files = new Map();

  return delta(refreshToken).pipe(
    map((file) => {
      // Debug
      // return file;

      const hash = file.file && file.file.hashes ? file.file.hashes.sha1Hash.toLowerCase() : null;
      const name = file.parentReference && file.parentReference.path ? join(file.parentReference.path, file.name).replace('/drive/root:/', '') : file.name;

      if ('deleted' in file) {
        files = files.remove(file.id);
        return formatAction('remove', file, name, hash);
      }

      const existing = files.get(file.id);
      let action;
      if (existing) {
        if (existing.name !== name) {
          action = {
            ...formatAction('move', file, name, hash),
            oldName: existing.name,
          };
        } else {
          action = formatAction('change', file, name, hash);
        }
      } else {
        const other = files.find(f => f.hash === hash);
        if (other) {
          action = {
            ...formatAction('copy', file, name, hash),
            from: other.name,
          };
        } else {
          action = formatAction('add', file, name, hash);
        }
      }

      files = files.set(file.id, {
        name,
        hash,
      });

      return action;
    }),
  );
};

module.exports = stream;
