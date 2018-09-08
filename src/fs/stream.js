const { fromEvent, from } = require('rxjs');
const { DateTime } = require('luxon');
const { flatMap, map, filter } = require('rxjs/operators');
const { join } = require('path');
const { log } = require('../utils/logger');
const createContent = require('./content');

const createFormatAction = directory => (
  (action, file) => {
    let type;

    switch (file.type) {
      case 'f':
        type = 'file';
        break;
      case 'd':
        type = 'folder';
        break;
      default:
        // @TODO remove types onedrive doesn't support!
        type = '';
        break;
    }

    return {
      action,
      id: file.ino,
      type,
      name: file.name,
      modified: file.mtime_ms ? DateTime.fromMillis(file.mtime_ms) : null,
      size: file.size,
      content: createContent(join(directory, file.name)),
      hash: typeof file['content.sha1hex'] === 'string' ? file['content.sha1hex'] : null,
    };
  }
);

const stream = (client, directory) => {
  const adding = new Set();
  const hashes = new Map();
  const formatAction = createFormatAction(directory);

  client.command(['subscribe', directory, 'onedrive', {
    // Exclude files and folders that begin with .
    expression: ['allof', ['match', '**'], ['match', '**', 'wholename']],
    fields: ['name', 'ino', 'content.sha1hex', 'type', 'exists', 'new', 'mtime_ms', 'size'],
  }], (error) => {
    if (error) {
      log('error', 'Error initiating watch:', error);
      process.exit(1);
    }
  });

  // Debug
  // return fromEvent(client, 'subscription');

  // Normalize filesystem events.
  return fromEvent(client, 'subscription').pipe(
    flatMap((resp) => {
      // Create a map of files by id.
      const fileActions = resp.files.reduce((actions, file) => {
        const a = [
          ...actions.get(file.ino) || [],
          file,
        ];

        return actions.set(file.ino, a);
      }, new Map());

      return from([...fileActions.values()].reduce((actions, items) => {
        let action;

        // If there are exactly two actions, this may be a file move.
        if (items.length === 2) {
          const [first, second] = items;

          if (
            !first.exists
            && !first.new
            && second.exists
            && second.new
          ) {
            return [
              ...actions,
              {
                ...formatAction('move', second),
                oldName: first.name,
              },
            ];
          }
        }

        return [
          ...actions,
          ...items.map((file) => {
            if (file.exists) {
              if (file.new) {
                action = 'add';
              } else {
                action = 'change';
              }
            } else {
              action = 'remove';
            }

            return formatAction(action, file);
          }),
        ];
      }, []));
    }),
    // Hold the add actions until a hash (from a change) is present.
    map((value) => {
      if (value.type === 'file') {
        if (value.action === 'add' && value.hash === null) {
          // Add to state store.
          adding.add(value.id);
          return undefined;
        }

        if (value.action === 'change' && value.hash === null) {
          // File is still writting.
          return undefined;
        }

        if (
          value.action === 'change'
          && value.hash !== null
          && adding.has(value.id)
        ) {
          // Remove from state.
          adding.delete(value.id);
          return {
            ...value,
            action: 'add',
          };
        }
      }

      return value;
    }),
    // Remove all the undefined values.
    filter(v => !!v),
    map((value) => {
      if (value.action === 'add' && value.hash) {
        const [name] = [...hashes.entries()].find(([, hash]) => hash === value.hash) || [undefined];
        if (name) {
          hashes.set(value.name, value.hash);
          return {
            ...value,
            action: 'copy',
            from: name,
          };
        }
      }

      // When a file is deleted, remove the hash from the state.
      if (value.action === 'remove') {
        hashes.delete(value.name);
        return value;
      }

      // Add every hash to the store (if there is one)
      if (value.hash) {
        hashes.set(value.name, value.hash);
        return value;
      }

      return value;
    }),
  );
};

module.exports = stream;
