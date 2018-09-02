const { map } = require('rxjs/operators');
const { DateTime } = require('luxon');
const { join } = require('path');
const delta = require('./delta');
const downloadFactory = require('./download');

const createFormatAction = (refreshToken) => {
  const createDownload = downloadFactory(refreshToken);

  return (action, file, name, hash) => {
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
      download: file['@microsoft.graph.downloadUrl'] ? createDownload(file['@microsoft.graph.downloadUrl']) : null,
    };
  };
};

const stream = (refreshToken) => {
  const files = new Map();
  const formatAction = createFormatAction(refreshToken);

  return delta(refreshToken).pipe(
    map((file) => {
      const hash = file.file && file.file.hashes ? file.file.hashes.sha1Hash.toLowerCase() : null;
      const existing = files.get(file.id);
      let { name } = file;
      // Use the name from the parent if it exists.
      if (file.parentReference && file.parentReference.path) {
        name = join(file.parentReference.path, file.name).replace('/drive/root:/', '');
      } else if (existing) {
        ({ name } = existing);
      }

      if ('deleted' in file) {
        files.delete(file.id);
        return formatAction('remove', file, name, hash);
      }

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
        const other = hash ? [...files.values()].find(f => f.hash === hash) : undefined;
        if (other) {
          action = {
            ...formatAction('copy', file, name, hash),
            from: other.name,
          };
        } else {
          action = formatAction('add', file, name, hash);
        }
      }

      files.set(file.id, {
        name,
        hash,
      });

      return action;
    }),
  );
};

module.exports = stream;
