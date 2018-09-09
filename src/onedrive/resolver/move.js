const { merge } = require('rxjs');
const { basename } = require('path');
const createFetch = require('../fetch');
const getParentId = require('./parent');
const createError = require('../../utils/error');
const { formatAction } = require('../../utils/format-action');

const moveItem = (refreshToken, type, name, id) => (
  merge(
    formatAction('move', 'start', type, name),
    Promise.resolve().then(async () => {
      const fetch = await createFetch(refreshToken);
      const parentId = await getParentId(fetch, name);

      const url = `https://graph.microsoft.com/v1.0/me/drive/items/${id}`;
      const response = await fetch(url, {
        method: 'PATCH',
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
      const data = await response.json();

      if (!response.ok) {
        throw createError(response, data);
      }

      return formatAction('move', 'end', type, name);
    }),
  )
);

module.exports = moveItem;
