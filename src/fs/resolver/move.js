const { join, dirname } = require('path');
const {
  ensureDir,
  move,
  copy,
} = require('fs-extra');
const formatAction = require('./format');

const moveItem = async (directory, type, name, oldName) => {
  const path = join(directory, name);
  const oldPath = join(directory, oldName);
  try {
    await ensureDir(dirname(path));
    await move(oldPath, path);
    return formatAction('move', 'end', type, name);
  } catch (error) {
    // No such file or directory.
    if (error.code === 'ENOENT') {
      return {
        ...await formatAction('move', 'error', type, name),
        error,
      };
    }

    // Attempt to move the file to the trash first.
    try {
      // Copy the existing file to the trash.
      const trashPath = join(directory, '.trash', name);
      await ensureDir(dirname(trashPath));
      await copy(path, trashPath);

      // Allow override this time.
      await ensureDir(dirname(path));
      await move(oldPath, path, {
        overwrite: true,
      });
      return formatAction('move', 'end', type, name);
    } catch (e) {
      // No such file or directory.
      if (e.code === 'ENOENT') {
        return {
          ...await formatAction('move', 'error', type, name),
          error: e,
        };
      }

      // Some other error we don't know how to deal with.
      throw e;
    }
  }
};

module.exports = moveItem;
