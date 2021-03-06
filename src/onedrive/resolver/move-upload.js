const { from, merge } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const createFolder = require('./create');
const move = require('./move');
const getParent = require('./parent');
const upload = require('./upload');
const remove = require('./remove');
const createFetch = require('../fetch');
const fetchItem = require('./item');
const createError = require('../../utils/error');

const fetchItems = async (refreshToken, name, fromName) => {
  const fetch = await createFetch(refreshToken);

  return Promise.all([
    Promise.resolve(fetch),
    fetchItem(fetch, fromName).then(async response => [response, await response.json()]),
    fetchItem(fetch, name).then(async response => [response, await response.json()]),
  ]);
};

const moveUpload = (refreshToken, type, name, hash, modified, size, content, fromName) => (
  from(fetchItems(refreshToken, name, fromName)).pipe(
    flatMap(([fetch, fromFile, toFile]) => {
      const [fromResponse, fromData] = fromFile;
      const [toResponse, toData] = toFile;

      if (!fromResponse.ok) {
        // The file we have been suggested to copy does not exist, so upload
        // instead.
        if (fromResponse.status === 404) {
          if (type === 'folder') {
            return createFolder(refreshToken, name);
          }

          return upload(refreshToken, name, hash, modified, size, content);
        }

        // Some other error we don't know how to deal with.
        throw createError(fromResponse, fromData);
      }

      if (!toResponse.ok) {
        // If we are not overriding an existing file, it is safe to move.
        if (toResponse.status === 404) {
          return from(getParent(fetch, name)).pipe(
            flatMap((toParent) => {
              // OneDrive does not support moving between drives!
              if (toParent.driveId !== fromData.parentReference.driveId) {
                return merge(
                  upload(refreshToken, name, hash, modified, size, content),
                  remove(refreshToken, type, fromName),
                );
              }

              // Safe to move.
              return move(refreshToken, type, name, fromData);
            }),
          );
        }

        // Some other error we don't know how to deal with.
        throw createError(toResponse, toData);
      }

      // If this is a folder, at this point, it's safe to move.
      if (type === 'folder') {
        return move(refreshToken, type, name, fromData);
      }

      // OneDrive does not support moving between drives!
      if (fromData.parentReference.driveId !== toData.parentReference.driveId) {
        return merge(
          upload(refreshToken, name, hash, modified, size, content),
          remove(refreshToken, type, fromName),
        );
      }

      const fromHash = fromData && fromData.file && fromData.file.hashes
        ? fromData.file.hashes.sha1Hash.toLowerCase()
        : null;
      const toHash = toData && toData.file && toData.file.hashes
        ? toData.file.hashes.sha1Hash.toLowerCase()
        : null;

      // The hash from the filesystem matches the suggested file to move.
      if (hash === fromHash) {
        // Ensure that the move is necessary. If we are overriding a file,
        // and that file has the same hash that we would be moving or
        // uploading, then there is no need to move the file and we should
        // remove the from file.
        if (fromHash === toHash) {
          return remove(refreshToken, type, fromName);
        }

        // Moving is safe. This means that the file we are moving from
        // has the same hash as the file we would upload, and the file
        // we are overriding has a different hash.
        return move(refreshToken, type, name, fromData);
      }

      // Be safe, upload the file.
      return merge(
        upload(refreshToken, name, hash, modified, size, content),
        remove(refreshToken, type, fromName),
      );
    }),
  )
);

module.exports = moveUpload;
