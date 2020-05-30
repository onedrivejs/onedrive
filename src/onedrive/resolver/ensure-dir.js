const createError = require('../../utils/error');

const ensureDir = async (fetch, name) => {
  let parent = {
    id: 'root',
    driveId: undefined,
  };
  const parts = name.split('/');

  // Itentially adding a loop so the requests are *not* executed in parallel.
  // eslint-disable-next-line no-restricted-syntax
  for (const folderName of parts) {
    let url;
    // See if the folder exists. This technically creates a async issue as it
    // might exist and then get deleted, but it is much faster than creating
    // the folders.
    if (!parent.driveId) {
      url = `me/drive/root:/${encodeURIComponent(folderName)}`;
    } else {
      url = `drives/${parent.driveId}/items/${parent.id}:/${encodeURIComponent(folderName)}`;
    }

    // eslint-disable-next-line no-await-in-loop
    let response = await fetch(url);
    let data = await response.json(); // eslint-disable-line no-await-in-loop

    // If the response is  ok, but the item is not folder-like, throw an error.
    if (response.ok && !('folder' in data) && !('remoteItem' in data) && !('package' in data)) {
      throw createError(response, data);
    }

    // If the folder is missing, create it.
    if (!response.ok && response.status === 404) {
      if (!parent.driveId) {
        url = `me/drive/items/${parent.id}/children`;
      } else {
        url = `drives/${parent.driveId}/items/${parent.id}/children`;
      }
      // eslint-disable-next-line no-await-in-loop
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          folder: {},
        }),
      });

      data = await response.json(); // eslint-disable-line no-await-in-loop

      if (!response.ok) {
        // Conflict means something already exists at this name, but is not a
        // folder. Check to see if it is folder-like.
        if (response.status !== 409) {
          throw createError(response, data);
        }

        if (!parent.driveId) {
          url = `me/drive/root:/${encodeURIComponent(folderName)}`;
        } else {
          url = `drives/${parent.driveId}/items/${parent.id}:/${encodeURIComponent(folderName)}`;
        }

        response = await fetch(url); // eslint-disable-line no-await-in-loop

        data = await response.json(); // eslint-disable-line no-await-in-loop

        // If the response is not ok, or the item is not folder-like, throw an error.
        if (!response.ok || (!('folder' in data) && !('remoteItem' in data) && !('package' in data))) {
          throw createError(response, data);
        }
      }
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
