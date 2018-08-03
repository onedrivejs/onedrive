const { map } = require('rxjs/operators');
const { DateTime } = require('luxon');
const { join } = require('path');
const { Map } = require('immutable');
const delta = require('./delta');

const stream = (refreshToken) => {
  let files = new Map();

  return delta(refreshToken).pipe(
    map((file) => {
      let type;
      if ('file' in file) {
        type = 'file';
      } else if ('folder' in file) {
        type = 'folder';
      } else {
        throw new Error('Unhandled item type');
      }

      // Debug
      // return file;

      const hash = file.file && file.file.hashes ? file.file.hashes.sha1Hash : null;
      const name = join(file.parentReference.path, file.name).replace('/drive/root:/', '');

      let action;
      let oldName;
      let from;

      const basic = {
        id: file.id,
        type,
        name,
      };

      if ('deleted' in file) {
        files = files.remove(file.id);
        return {
          action: 'remove',
          ...basic,
        };
      }

      const existing = files.get(file.id);
      if (existing) {
        if (existing.name !== name) {
          action = 'move';
          oldName = existing.name;
        } else {
          action = 'change';
        }
      } else {
        const other = files.find(f => f.hash === hash);
        if (other) {
          action = 'copy';
          from = other.name;
        } else {
          action = 'add';
        }
      }

      files = files.set(file.id, {
        name,
        hash,
      });

      return {
        action,
        ...basic,
        from,
        modified: file.lastModifiedDateTime ? DateTime.fromISO(file.lastModifiedDateTime) : null,
        hash,
        downloadUrl: file['@microsoft.graph.downloadUrl'] ? file['@microsoft.graph.downloadUrl'] : null,
        oldName,
      };
    }),
  );
};

module.exports = stream;
