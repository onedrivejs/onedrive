const { merge } = require('rxjs');
const { join } = require('path');
const { ensureDir } = require('fs-extra');
const { formatAction } = require('../../utils/format-action');

const createFolder = (directory, name) => {
  const type = 'folder';
  const path = join(directory, name);

  return merge(
    formatAction('create', 'start', type, name),
    ensureDir(path).then(() => formatAction('create', 'end', type, name)),
  );
};

module.exports = createFolder;
