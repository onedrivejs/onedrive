const { merge } = require('rxjs');
const { dirname, basename } = require('path');
const ensureDir = require('./ensure-dir');
const createFetch = require('../fetch');
const createError = require('../../utils/error');
const { formatAction } = require('../../utils/format-action');

const moveItem = (refreshToken, type, name, oldName) => {
  const oldItemUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${oldName}`;

  return merge(
    formatAction('move', 'start', type, name),
    Promise.resolve().then(async () => {
      const fetch = await createFetch(refreshToken);
      let response = await fetch(oldItemUrl);
      let data = await response.json();

      if (!response.ok) {
        const error = createError(response, oldItemUrl, data);

        // No file to move.
        if (response.status === 404) {
          return formatAction('move', error, type, name);
        }

        throw error;
      }

      const { id } = data;

      const directory = dirname(name);
      const fileName = basename(name);

      let parentId;
      if (directory === '.') {
        const url = 'https://graph.microsoft.com/v1.0/me/drive/items/root';
        response = await fetch(url);
        data = await response.json();
        if (!response.ok) {
          throw createError(response, url, data);
        }

        parentId = data.id;
      } else {
        parentId = await ensureDir(refreshToken, directory);
      }

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
          name: fileName,
        }),
      });
      data = await response.json();

      if (!response.ok) {
        throw createError(response, url, data);
      }

      return formatAction('move', 'end', type, name);
    }),
  );
};

module.exports = moveItem;
