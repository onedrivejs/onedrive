const { merge } = require('rxjs');
const ensureDir = require('./ensure-dir');
const createFetch = require('../fetch');
const { formatAction } = require('../../utils/format-action');

const createFolder = (refreshToken, name) => {
  const type = 'folder';

  return merge(
    formatAction('create', 'start', type, name),
    createFetch(refreshToken).then(fetch => ensureDir(fetch, name)).then(() => formatAction('create', 'end', type, name)),
  );
};

module.exports = createFolder;
