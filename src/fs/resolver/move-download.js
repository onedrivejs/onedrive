const { join } = require('path');
const { from, merge } = require('rxjs');
const { flatMap, catchError, share } = require('rxjs/operators');
const { fromFile: hashFromFile } = require('hasha');
const move = require('./move');
const remove = require('./remove');
const download = require('./download');

const moveDownload = (directory, type, name, modified, hash, fromName, downloder) => {
  const toPath = join(directory, name);
  const fromPath = join(directory, fromName);

  // Always attempt to move a folder.
  if (type === 'folder') {
    return move(directory, type, name, fromName);
  }

  return from(hashFromFile(fromPath, { algorithm: 'sha1' })).pipe(
    flatMap((fromHash) => {
      // The hash from OneDrive matches the suggested file to move.
      if (hash === fromHash) {
        return from(hashFromFile(toPath, { algorithm: 'sha1' })).pipe(
          flatMap((toHash) => {
            // Ensure that the copy is necessary. If we are overriding a file,
            // and that file has the same hash that we would be copying or
            // downloading, then there is no need to copy the file and we should
            // die here.
            if (hash === toHash) {
              return remove(directory, type, fromName);
            }

            // Moving is safe. This means that the file we are moving
            // has the same hash as the file we would download, and the file
            // we are overriding has a different hash.
            return move(directory, type, name, fromName);
          }),
          catchError((e) => {
            // If we are not overriding an existing file, it is safe to copy.
            if (e.code === 'ENOENT') {
              return move(directory, type, name, fromName);
            }

            // Some other error we don't know how to deal with.
            throw e;
          }),
        );
      }

      // Be safe, download the file and remove the old one.
      return merge(
        download(directory, name, hash, modified, downloder),
        remove(directory, type, fromName),
      );
    }),
    catchError((e) => {
      // The file we have been suggested to move does not exist, so download
      // instead.
      if (e.code === 'ENOENT') {
        return download(directory, name, hash, modified, downloder);
      }

      // Some other error we don't know how to deal with.
      throw e;
    }),
    share(),
  );
};

module.exports = moveDownload;
