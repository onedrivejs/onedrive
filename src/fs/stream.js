const { Client } = require('fb-watchman');
const { fromEvent, from } = require('rxjs');
const { flatMap, map, filter } = require('rxjs/operators');
const { Map, Set } = require('immutable');

const client = new Client();

const formatAction = (action, file) => {
  let type;

  // @TODO split into a seperate function.
  switch (file.type) {
    case 'f':
      type = 'file';
      break;
    case 'd':
      type = 'folder';
      break;
    default:
      break;
  }

  // @TODO Add the lastModifiedDateTime to the action
  return {
    action,
    id: file.ino,
    type,
    name: file.name,
    hash: typeof file['content.sha1hex'] === 'string' ? file['content.sha1hex'] : null,
  };
};

const stream = (directory) => {
  let adding = new Set();
  let hashes = new Map();

  client.command(['subscribe', directory, 'onedrive', {
    expression: ['not', ['match', '.*']],
    fields: ['name', 'ino', 'content.sha1hex', 'type', 'exists', 'new', 'mtime_ms'],
  }]);

  // Debug
  // return fromEvent(client, 'subscription');

  // Normalize filesystem events.
  return fromEvent(client, 'subscription').pipe(
    flatMap((resp) => {
      // Create a map of files by id.
      const fileActions = resp.files.reduce((map, file) => {
        const a = [
          ...map.get(file.ino, []),
          file,
        ];

        return map.set(file.ino, a);
      }, new Map());

      return from(fileActions.map((items) => {
        let action;

        // Resolve two actions.
        if (items.length === 2) {
          const [first, second] = items;

          if (!first.exists
            && !first.new
            && second.exists
            && second.new
          ) {
            return {
              ...formatAction('move', second),
              oldName: first.name,
            };
          }
        }

        // Something is wrong.
        if (items.length > 2) {
          console.dir(items);
          throw new Error('Unhandled watchman action');
        }

        // Only a single action.
        const [file] = items;

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
      }).toArray());
    }),
    // Hold the add actions until a hash (from a change) is present.
    map((value) => {
      if (value.type === 'file') {
        if (value.action === 'add' && value.hash === null) {
          // Add to state store.
          adding = adding.add(value.id);
          return undefined;
        }

        if (value.action === 'change' && value.hash === null) {
          // File is still writting.
          return undefined;
        }

        if (
          value.action === 'change'
          && value.hash !== null
          && adding.get(value.id)
        ) {
          // Remove from state.
          adding = adding.remove(value.id);
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
        const name = hashes.findKey(hash => hash === value.hash);
        if (name) {
          hashes = hashes.set(value.name, value.hash);
          return {
            ...value,
            action: 'copy',
            from: name,
          };
        }
      }

      // When a file is deleted, remove the hash from the state.
      if (value.action === 'remove') {
        hashes = hashes.remove(value.name);
        return value;
      }

      // Add every hash to the store (if there is one)
      if (value.hash) {
        hashes = hashes.set(value.name, value.hash);
        return value;
      }

      return value;
    }),
  );
};

module.exports = stream;
