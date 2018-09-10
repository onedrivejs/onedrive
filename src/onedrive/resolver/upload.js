const {
  Subject,
  from,
  merge,
  EMPTY,
} = require('rxjs');
const { flatMap } = require('rxjs/operators');
const { dirname, basename } = require('path');
const { DateTime } = require('luxon');
const getParent = require('./parent');
const fetchItem = require('./item');
const createFetch = require('../fetch');
const createError = require('../../utils/error');
const { formatAction, formatActionSync } = require('../../utils/format-action');

const shouldUploadFile = async (refreshToken, name, hash, modified) => {
  const fetch = await createFetch(refreshToken);
  const response = await fetchItem(fetch, name);
  const data = await response.json();

  const fileHash = data.file && data.file.hashes ? data.file.hashes.sha1Hash.toLowerCase() : null;

  // The file hash is the same, skip uploading.
  if (hash === fileHash) {
    return false;
  }


  if (!response.ok) {
    if (response.status === 404) {
      return true;
    }

    throw createError(response, data);
  }

  const fileModified = DateTime.fromISO(data.lastModifiedDateTime);

  // The file on OneDrive is newer, skip uploading.
  if (fileModified > modified) {
    return false;
  }

  return true;
};

const getUploadUrl = async (fetch, name) => {
  const fileName = basename(name);
  const parent = await getParent(fetch, name);

  const url = `https://graph.microsoft.com/v1.0/drives/${parent.driveId}/items/${parent.id}:/${fileName}:/createUploadSession`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: {
        '@microsoft.graph.conflictBehavior': 'replace',
        name: fileName,
      },
    }),
  });

  const data = await response.json();

  // Handle the error gracefully?
  if (!response.ok) {
    throw createError(response, data);
  }

  return data.uploadUrl;
};

const uploadFile = (refreshToken, name, hash, modified, size, content) => {
  const type = 'file';

  const progress = new Subject();

  return from(shouldUploadFile(refreshToken, name, hash, modified)).pipe(
    flatMap((should) => {
      if (!should) {
        return EMPTY;
      }

      return merge(
        formatAction('upload', 'start', type, name),
        progress,
        Promise.resolve().then(async () => {
          const fetch = await createFetch(refreshToken);
          const url = await getUploadUrl(fetch, name);

          let chunks = [];

          // Max chunk is 60MB, but OneDrive wants increments of 320KB,
          // therefor, we will use a maximum of 6553600 bytes per chunk.

          // split the file into uploadable chunks if it is smaller than a
          // single chunk.
          const MAX = 6553600;
          if (size <= MAX) {
            chunks = [
              {
                start: 0,
                end: size > 0 ? size - 1 : 0,
              },
            ];
          } else {
            const num = Math.ceil(size / MAX);
            let i = num;
            let start = 0;
            let end = MAX - 1;
            while (i > 0) {
              chunks = [
                ...chunks,
                {
                  start,
                  end,
                },
              ];

              start += MAX;
              end += MAX;

              // Do not exceed the end of the file!
              if (end > size - 1) {
                end = size - 1;
              }

              i -= 1;
            }
          }

          let i = 0;
          // eslint-disable-next-line no-restricted-syntax
          for (const { start, end } of chunks) {
            progress.next(formatActionSync('upload', 'start', type, name, [i + 1, chunks.length]));

            // Each request must be sync (one after the other). OneDrive does
            // not allow chunks to be uploaded out of order.
            // eslint-disable-next-line no-await-in-loop
            const response = await fetch(url, {
              method: 'PUT',
              headers: {
                'Content-Length': size > 0 ? end - start + 1 : 0,
                'Content-Range': `bytes ${start}-${end}/${size}`,
              },
              body: content({
                start,
                end,
              }),
            });

            // eslint-disable-next-line no-await-in-loop
            const data = await response.json();

            // Gracefully handle the error somehow?
            if (!response.ok) {
              throw createError(response, data);
            }

            progress.next(formatActionSync('upload', 'end', type, name, [i + 1, chunks.length]));
            i += 1;
          }

          progress.complete();
          return formatAction('upload', 'end', type, name);
        }),
      );
    }),
  );
};

module.exports = uploadFile;
