const { join, dirname } = require('path');
const {
  ensureDir,
  move,
} = require('fs-extra');
const formatAction = require('./format');

const remove = async (directory, type, name) => {
  const path = join(directory, name);
  const trashPath = join(directory, '.trash', name);
  try {
    await ensureDir(dirname(trashPath));
    await move(path, trashPath, {
      overwrite: true,
    });
    return formatAction('remove', 'end', type, name);
  } catch (error) {
    // No such file or directory.
    if (error.code === 'ENOENT') {
      return {
        ...await formatAction('remove', 'error', type, name),
        error,
      };
    }

    // Some other error we don't know how to deal with.
    throw error;
  }
};

module.exports = remove;
