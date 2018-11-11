const { merge, of } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const { basename } = require('path');
const createFetch = require('../fetch');
const getParent = require('./parent');
const createSeparator = require('../../separator');
const createError = require('../../utils/error');
const { formatAction } = require('../../utils/format-action');

const separator = createSeparator();

const copyFile = (refreshToken, name, { id, parentReference: { driveId } }) => {
  const type = 'file';

  return of(undefined).pipe(
    separator,
    flatMap(() => (
      merge(
        formatAction('copy', 'start', type, name),
        Promise.resolve().then(async () => {
          const fetch = await createFetch(refreshToken);
          const { id: parentId, driveId: parentDriveId } = await getParent(fetch, name);

          const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${id}/copy`;
          const response = await fetch(url, {
            method: 'POST',
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

          if (!response.ok) {
            throw createError(response, await response.json());
          }

          return formatAction('copy', 'end', type, name);
        }),
      )
    )),
  );
};

module.exports = copyFile;
