const { join, dirname } = require('path');
const { merge } = require('rxjs');
const {
  ensureDir,
  copy,
} = require('fs-extra');
const { formatAction } = require('../../utils/format-action');

// @TODO Create some sort of method for preventing a useless copy. A useless
//       copy is when the file you are copying from has the same hash as the
//       file you are copying too. Basically, if you are overridding a file with
//       the copy, check to ensure that it's not pointless. maybe the shouldCopyFile
//       can return an ENUM? Or maybe it would be best if it just returned the
//       proper observable or an empty one. This could also be moved to a
//       a seperate file since it deals with both copying and downloading.
//       maybe rename to copyDownloadFile and it's just a new observable with a
//       flatMap.

const copyFile = (directory, name, fromName) => {
  const type = 'file';
  const path = join(directory, name);
  const fromPath = join(directory, fromName);

  return merge(
    formatAction('copy', 'start', type, name),
    Promise.resolve().then(async () => {
      try {
        await ensureDir(dirname(path));
        await copy(fromPath, path, {
          overwrite: false,
          errorOnExist: true,
          preserveTimestamps: true,
        });
        return formatAction('copy', 'end', type, name);
      } catch (error) {
        // No such file or directory.
        if (error.code === 'ENOENT') {
          return formatAction('copy', error, type, name);
        }

        // Attempt to move the file to the trash first.
        try {
          // Copy the existing file to the trash.
          const trashPath = join(directory, '.trash', name);
          await ensureDir(dirname(trashPath));
          await copy(path, trashPath);

          // Allow override this time.
          await ensureDir(dirname(path));
          await copy(fromPath, path, {
            preserveTimestamps: true,
          });
          return formatAction('copy', 'end', type, name);
        } catch (e) {
          // No such file or directory.
          if (e.code === 'ENOENT') {
            return formatAction('copy', e, type, name);
          }

          // Some other error we don't know how to deal with.
          throw e;
        }
      }
    }),
  );
};

module.exports = copyFile;
