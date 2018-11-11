const { of, merge } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const fetchItem = require('./item');
const createFetch = require('../fetch');
const createError = require('../../utils/error');
const { formatAction } = require('../../utils/format-action');
const createSeparator = require('../../separator');

const separator = createSeparator();

const remove = (refreshToken, type, name) => (
  of(undefined).pipe(
    separator,
    flatMap(() => (
      merge(
        formatAction('remove', 'start', type, name),
        Promise.resolve().then(async () => {
          const fetch = await createFetch(refreshToken);
          let response = await fetchItem(fetch, name);
          const data = await response.json();

          if (!response.ok) {
            // The item has already been deleted.
            if (response.status === 404) {
              return formatAction('remove', createError(response, data), type, name);
            }

            throw createError(response);
          }

          const { id, parentReference: { driveId } } = data;
          const url = `https://graph.microsoft.com/v1.0/me/drives/${driveId}/items/${id}`;
          response = await fetch(url, {
            method: 'DELETE',
          });


          if (!response.ok) {
            // The item has already been deleted.
            if (response.status === 404) {
              return formatAction('remove', createError(response, data), type, name);
            }

            throw createError(response);
          }

          return formatAction('remove', 'end', type, name);
        }),
      )
    )),
  )
);

module.exports = remove;
