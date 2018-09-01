const { merge } = require('rxjs');
const { basename } = require('path');
const createFetch = require('../fetch');
const getParentId = require('./parent');
const fetchItem = require('./item');
const createError = require('../../utils/error');
const { formatAction } = require('../../utils/format-action');

const copyFile = (refreshToken, name, oldName) => {
  const type = 'file';

  return merge(
    formatAction('copy', 'start', type, name),
    Promise.resolve().then(async () => {
      const fetch = await createFetch(refreshToken);
      let response = await fetchItem(fetch, oldName);
      let data = await response.json();

      if (!response.ok) {
        const error = createError(response, data);

        // No file to copy.
        if (response.status === 404) {
          return formatAction('copy', error, type, name);
        }

        throw error;
      }

      const { id } = data;
      const parentId = await getParentId(fetch, name);

      const url = `https://graph.microsoft.com/v1.0/me/drive/items/${id}/copy`;
      response = await fetch(url, {
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
      data = await response.json();

      if (!response.ok) {
        throw createError(response, data);
      }

      return formatAction('copy', 'end', type, name);
    }),
  );
};

module.exports = copyFile;
