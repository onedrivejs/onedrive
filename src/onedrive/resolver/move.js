const { merge } = require('rxjs');
const { basename } = require('path');
const createFetch = require('../fetch');
const getParentId = require('./parent');
const fetchItem = require('./item');
const createError = require('../../utils/error');
const { formatAction } = require('../../utils/format-action');

const moveItem = (refreshToken, type, name, oldName) => (
  merge(
    formatAction('move', 'start', type, name),
    Promise.resolve().then(async () => {
      const fetch = await createFetch(refreshToken);
      let response = await fetchItem(fetch, oldName);
      let data = await response.json();

      if (!response.ok) {
        const error = createError(response, data);

        // No file to move.
        // @TODO Then upload!
        if (response.status === 404) {
          return formatAction('move', error, type, name);
        }

        throw error;
      }

      const { id } = data;
      const parentId = await getParentId(fetch, name);

      const url = `https://graph.microsoft.com/v1.0/me/drive/items/${id}`;
      response = await fetch(url, {
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
      data = await response.json();

      if (!response.ok) {
        throw createError(response, data);
      }

      return formatAction('move', 'end', type, name);
    }),
  )
);

module.exports = moveItem;
