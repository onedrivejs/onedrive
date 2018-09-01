const { sep } = require('path');
const createError = require('../../utils/error');
const createFetch = require('../fetch');

const ensureDir = async (refreshToken, name) => {
  let parentId = 'root';
  const parts = name.split(sep);

  const fetch = await createFetch(refreshToken);

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

    // Gracefully handle the error somehow?
    if (!response.ok) {
      throw createError(response, url, data);
    }

    parentId = data.id;
  }

  return parentId;
};

module.exports = ensureDir;
