const { merge } = require('rxjs');
const ensureDir = require('./ensure-dir');
const { formatAction } = require('../../utils/format-action');

const createFolder = (refreshToken, name) => {
  const type = 'folder';

  return merge(
    formatAction('create', 'start', type, name),
    ensureDir(refreshToken, name).then(() => formatAction('create', 'end', type, name)),
  );
};

module.exports = createFolder;
