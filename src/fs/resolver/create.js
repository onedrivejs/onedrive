const { join } = require('path');
const { ensureDir } = require('fs-extra');
const formatAction = require('../../utils/format-action');

const createFolder = async (directory, name) => {
  const path = join(directory, name);
  const type = 'folder';
  await ensureDir(path);
  return formatAction('create', 'end', type, name);
};

module.exports = createFolder;
