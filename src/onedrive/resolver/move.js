const { merge } = require('rxjs');
const { basename } = require('path');
const createFetch = require('../fetch');
const getParent = require('./parent');
const createError = require('../../utils/error');
const { formatAction } = require('../../utils/format-action');

const moveItem = (refreshToken, type, name, { id, parentReference: { driveId } }) => (
  merge(
    formatAction('move', 'start', type, name),
    Promise.resolve().then(async () => {
      const fetch = await createFetch(refreshToken);
      const { id: parentId, driveId: parentDriveId } = await getParent(fetch, name);

      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${id}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentReference: {
            id: parentId,
            driveId: parentDriveId,
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
