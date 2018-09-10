const { sep } = require('path');
const createError = require('../../utils/error');

const ensureDir = async (fetch, name) => {
  let parent = {
    id: 'root',
    driveId: undefined,
  };
  const parts = name.split(sep);

  // Itentially adding a loop so the requests are *not* executed in parallel.
  // eslint-disable-next-line no-restricted-syntax
  for (const folderName of parts) {
    let url;
    if (!parent.driveId) {
      url = `https://graph.microsoft.com/v1.0/me/drive/items/${parent.id}/children`;
    } else {
      url = `https://graph.microsoft.com/v1.0/drives/${parent.driveId}/items/${parent.id}/children`;
    }
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
      throw createError(response, data);
    }

    if ('remoteItem' in data) {
      parent = {
        id: data.remoteItem.id,
        driveId: data.remoteItem.parentReference
          ? data.remoteItem.parentReference.driveId
          : undefined,
      };
    } else {
      parent = {
        id: data.id,
        driveId: data.parentReference ? data.parentReference.driveId : undefined,
      };
    }
  }

  return parent;
};

module.exports = ensureDir;
