const { join, dirname } = require('path');
const { ensureDir } = require('fs-extra');
const formatAction = require('./format');

const createFolder = async (directory, name) => {
  const path = join(directory, name);
  const type = 'folder';
  try {
    await ensureDir(dirname(path));
    return formatAction('create', 'end', type, name);
  } catch (e) {
    if (e.code === 'EEXIST') {
      return formatAction('create', 'exists', type, name);
    }

    // Some other error we don't know how to deal with.
    throw e;
  }
};

module.exports = createFolder;
