const { from, EMPTY } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const copy = require('./copy');
const upload = require('./upload');
const createFetch = require('../fetch');
const fetchItem = require('./item');
const createError = require('../../utils/error');

const copyUploadFile = (directory, refreshToken, name, hash, modified, size, fromName) => {
  const item = Promise.resolve().then(async () => {
    const fetch = await createFetch(refreshToken);

    return Promise.all([
      fetchItem(fetch, fromName).then(async response => [response, await response.json()]),
      fetchItem(fetch, name).then(async response => [response, await response.json()]),
    ]);
  });

  return from(item).pipe(
    flatMap(([fromFile, toFile]) => {
      const [fromResponse, fromData] = fromFile;
      const [toResponse, toData] = toFile;
      if (!fromResponse.ok) {
        // The file we have been suggested to copy does not exist, so upload
        // instead.
        if (fromResponse.status === 404) {
          return upload(directory, refreshToken, name, hash, modified, size);
        }

        // Some other error we don't know how to deal with.
        throw createError(fromResponse, fromData);
      }

      if (!toResponse.ok) {
        // If we are not overriding an existing file, it is safe to copy.
        if (toResponse.status === 404) {
          return copy(refreshToken, name, fromName);
        }

        // Some other error we don't know how to deal with.
        throw createError(toResponse, toData);
      }

      const fromHash = fromData && fromData.file && fromData.file.hashes
        ? fromData.file.hashes.sha1Hash.toLowerCase()
        : null;
      const toHash = toData && toData.file && toData.file.hashes
        ? toData.file.hashes.sha1Hash.toLowerCase()
        : null;

      // The hash from the filesystem matches the suggested file to copy.
      if (hash === fromHash) {
        // Ensure that the copy is necessary. If we are overriding a file,
        // and that file has the same hash that we would be copying or
        // uploading, then there is no need to copy the file and we should
        // die here.
        if (fromHash === toHash) {
          return EMPTY;
        }

        // Copying is safe. This means that the file we are copying from
        // has the same hash as the file we would upload, and the file
        // we are overriding has a different hash.
        return copy(refreshToken, name, fromName);
      }

      // Be safe, upload the file.
      return upload(directory, refreshToken, name, hash, modified, size);
    }),
  );
};

module.exports = copyUploadFile;
