const { merge } = require('rxjs');
const { basename } = require('path');
const createFetch = require('../fetch');
const getParentId = require('./parent');
const createError = require('../../utils/error');
const { formatAction } = require('../../utils/format-action');

const copyFile = (refreshToken, name, id) => {
  const type = 'file';

  return merge(
    formatAction('copy', 'start', type, name),
    Promise.resolve().then(async () => {
      const fetch = await createFetch(refreshToken);
      const parentId = await getParentId(fetch, name);

      const url = `https://graph.microsoft.com/v1.0/me/drive/items/${id}/copy`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentReference: {
            id: parentId,
          },
          name: basename(name),
        }),
      });

      if (!response.ok) {
        throw createError(response, await response.json());
      }

      return formatAction('copy', 'end', type, name);
    }),
  );
};

module.exports = copyFile;
