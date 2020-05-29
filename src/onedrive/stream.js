const { of, concat, Subject } = require('rxjs');
const { flatMap, map } = require('rxjs/operators');
const { DateTime } = require('luxon');
const { join } = require('path');
const delta = require('./delta');
const createDownload = require('./download');
const ItemTypeError = require('../error/item-type');

const actionFormatter = refreshToken => (
  (action, file, name, hash) => {
    let type;
    if ('file' in file) {
      type = 'file';
    } else if ('folder' in file || 'remoteItem' in file) {
      type = 'folder';
    }

    if (!type) {
      const error = new ItemTypeError(file, name);
      return {
        action: 'error',
        id: file.id,
        type: 'unknown',
        name: error.filename,
        error,
      };
    }

    return {
      action,
      id: file.id,
      type,
      name,
      modified: file.lastModifiedDateTime ? DateTime.fromISO(file.lastModifiedDateTime) : null,
      hash,
      download: file['@microsoft.graph.downloadUrl'] ? createDownload(refreshToken, file.id, file.parentReference.driveId) : null,
    };
  }
);

const stream = (refreshToken) => {
  const files = new Map();
  const shared = new Map();
  const formatAction = actionFormatter(refreshToken);

  return delta(refreshToken).pipe(
    flatMap((file) => {
      if (!('deleted' in file) && ('remoteItem' in file) && !shared.has(file.id)) {
        const cancel = new Subject();
        shared.set(file.id, cancel);

        const remoteItemStream = delta(
          refreshToken,
          file.remoteItem.parentReference.driveId,
          file.remoteItem.id,
          cancel,
        ).pipe(
          // Attach the shared folder name as a namespace.
          map(f => ({
            ...f,
            namespace: file,
          })),
        );

        return concat(of(file), remoteItemStream);
      }

      return of(file);
    }),
    map((file) => {
      const hash = file.file && file.file.hashes ? file.file.hashes.sha1Hash.toLowerCase() : null;
      const existing = files.get(file.id);
      let { name } = file;
      // Use the name from the parent if it exists.
      // @TODO What is this? Creating folder drives on File System start
      if (file.parentReference && file.parentReference.path) {
        // Possible paths:
        // /drive/root:
        // /drive/root:/example%20folder
        // /drives/abcd/items/efg!123:
        // /drives/abcd/items/efg!123:/example%20folder
        let [, parentPath] = file.parentReference.path.split(':');
        // Remove the first forward slash and the URL encoding.
        parentPath = decodeURI((parentPath || '').replace(/^\//, ''));
        if (file.namespace) {
          name = join(file.namespace.name, parentPath, file.name);
        } else {
          name = join(parentPath, file.name);
        }
      } else if (existing) {
        ({ name } = existing);
      }

      if ('deleted' in file) {
        files.delete(file.id);
        // If this is a shared folder, stop the delta.
        if (shared.get(file.id)) {
          shared.get(file.id).complete();
          shared.delete(file.id);
        }
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
