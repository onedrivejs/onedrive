const { merge } = require('rxjs');
const { sep } = require('path');
const createFetch = require('../fetch');
const formatAction = require('../../utils/format-action');

const createFolder = (refreshToken, name) => {
  const type = 'folder';

  return merge(
    formatAction('create', 'start', type, name),
    Promise.resolve().then(async () => {
      let parentId = 'root';
      const fetch = await createFetch(refreshToken);
      const parts = name.split(sep);

      // Itentially adding a loop so the requests are *not* executed in parallel.
      // eslint-disable-next-line no-restricted-syntax
      for (const folderName of parts) {
        const url = `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`;
        // eslint-disable-next-line no-await-in-loop
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: folderName,
            folder: {},
          }),
        });

        const data = await response.json(); // eslint-disable-line no-await-in-loop

        if (!response.ok) {
          const error = new Error(`${response.status} ${response.statusText} ${url}`);
          error.data = data;
          return formatAction('create', error, type, name);
        }

        parentId = data.id;
      }

      return formatAction('create', 'end', type, name);
    }),
  );
};

module.exports = createFolder;
