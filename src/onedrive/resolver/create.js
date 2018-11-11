const { merge, of } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const ensureDir = require('./ensure-dir');
const createSeparator = require('../../separator');
const createFetch = require('../fetch');
const { formatAction } = require('../../utils/format-action');

const separator = createSeparator();

const createFolder = (refreshToken, name) => {
  const type = 'folder';

  return of(undefined).pipe(
    separator,
    flatMap(() => (
      merge(
        formatAction('create', 'start', type, name),
        createFetch(refreshToken).then(fetch => ensureDir(fetch, name)).then(() => formatAction('create', 'end', type, name)),
      )
    )),
  );
};

module.exports = createFolder;
