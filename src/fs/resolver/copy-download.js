const { join } = require('path');
const { from, EMPTY } = require('rxjs');
const { flatMap, catchError, share } = require('rxjs/operators');
const { fromFile: hashFromFile } = require('hasha');
const copy = require('./copy');
const download = require('./download');

const copyDownloadFile = (directory, name, modified, hash, fromName, downloder) => {
  const toPath = join(directory, name);
  const fromPath = join(directory, fromName);

  return from(hashFromFile(fromPath, { algorithm: 'sha1' })).pipe(
    flatMap((fromHash) => {
      // The hash from OneDrive matches the suggested file to copy.
      if (hash === fromHash) {
        return from(hashFromFile(toPath, { algorithm: 'sha1' })).pipe(
          flatMap((toHash) => {
            // Ensure that the copy is necessary. If we are overriding a file,
            // and that file has the same hash that we would be copying or
            // downloading, then there is no need to copy the file and we should
            // die here.
            if (hash === toHash) {
              return EMPTY;
            }

            // Copying is safe. This means that the file we are copying from
            // has the same hash as the file we would download, and the file
            // we are overriding has a different hash.
            return copy(directory, name, fromName);
          }),
          catchError((e) => {
            // If we are not overriding an existing file, it is safe to copy.
            if (e.code === 'ENOENT') {
              return copy(directory, name, fromName);
            }

            // Some other error we don't know how to deal with.
            throw e;
          }),
        );
      }

      // Be safe, download the file.
      return download(directory, name, hash, modified, downloder);
    }),
    catchError((e) => {
      // The file we have been suggested to copy does not exist, so download
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

module.exports = copyDownloadFile;
