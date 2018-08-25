const { merge } = require('rxjs');
const { join, dirname } = require('path');
const {
  ensureDir,
  move,
} = require('fs-extra');
const { formatAction } = require('../../utils/format-action');

const remove = (directory, type, name) => {
  const path = join(directory, name);
  const trashPath = join(directory, '.trash', name);

  return merge(
    formatAction('remove', 'start', type, name),
    Promise.resolve().then(async () => {
      try {
        await ensureDir(dirname(trashPath));
        await move(path, trashPath, {
          overwrite: true,
        });
        return formatAction('remove', 'end', type, name);
      } catch (error) {
        // No such file or directory.
        if (error.code === 'ENOENT') {
          return formatAction('remove', error, type, name);
        }

        // Some other error we don't know how to deal with.
        throw error;
      }
    }),
  )
};

module.exports = remove;
