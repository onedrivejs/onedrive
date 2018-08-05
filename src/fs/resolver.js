const {
  merge,
  empty,
  from,
  of,
} = require('rxjs');
const { flatMap, filter } = require('rxjs/operators');
const { DateTime } = require('luxon');
const { promisify } = require('util');
const { fromFile: hashFromFile } = require('hasha');
const promisePipe = require('promisepipe');
const fs = require('fs');
const {
  ensureDir,
  move,
  copy,
  remove,
} = require('fs-extra');
const { join, dirname } = require('path');
const fetch = require('node-fetch');
const readdir = require('recursive-readdir');
const { PassThrough } = require('stream');

const utimes = promisify(fs.utimes);
const stat = promisify(fs.stat);

// This function is unnecessarily async so it doesn't have to be wrapped in
// Observable.of() everywhere.
const formatAction = async (action, phase, type, name) => ({
  action,
  phase,
  type,
  name,
});

const createFolder = async (directory, name) => {
  const path = join(directory, name);
  const type = 'folder';
  try {
    await ensureDir(dirname(path));
    return formatAction('create', 'end', type, name);
  } catch (e) {
    if (e.code === 'EEXIST') {
      return formatAction('create', 'exists', type, name);
    }

    // Some other error we don't know how to deal with.
    throw e;
  }
};

const shouldDownloadFile = async (directory, name, hash, modified) => {
  const path = join(directory, name);
  try {
    const fileHash = await hashFromFile(path, { algorithm: 'sha1' });

    // The file hash is the same, skip downloading.
    if (hash === fileHash) {
      return false;
    }

    const fileStat = await stat(path);
    const fileModified = DateTime.fromJSDate(fileStat.mtime, { zone: 'local' });

    // The file on the file system is newer, skip downloading.
    if (fileModified > modified) {
      return false;
    }
  } catch (e) {
    // No such file or directory.
    if (e.code === 'ENOENT') {
      return true;
    }

    // Some other error we don't know how to deal with.
    throw e;
  }

  return true;
};

const moveFile = async (directory, name, oldName) => {
  const type = 'file';
  const path = join(directory, name);
  const oldPath = join(directory, oldName);
  try {
    await move(oldPath, path);
    return formatAction('move', 'end', type, name);
  } catch (error) {
    // No such file or directory.
    if (error.code === 'ENOENT') {
      return {
        ...formatAction('move', 'error', type, name),
        error,
      };
    }

    // Attempt to move the file to the trash first.
    try {
      // Copy the existing file to the trash.
      const trashPath = join(directory, '.trash', name);
      await ensureDir(dirname(trashPath));
      await copy(path, trashPath);

      // Allow override this time.
      await move(oldPath, path, {
        overwrite: true,
      });
      return formatAction('move', 'end', type, name);
    } catch (e) {
      // No such file or directory.
      if (error.code === 'ENOENT') {
        return {
          ...formatAction('move', 'error', type, name),
          error,
        };
      }

      // Some other error we don't know how to deal with.
      throw e;
    }
  }
};

const downloadFile = async (directory, name, modified, downloadUrl) => {
  const type = 'file';
  const path = join(directory, name);
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    return {
      ...formatAction('download', 'error', type, name),
      error: new Error(`${response.status} ${response.statusText} ${downloadUrl}`),
    };
  }

  try {
    await ensureDir(dirname(path));
    const body = new PassThrough();
    response.body.pipe(body);
    await promisePipe(body, fs.createWriteStream(path, {
      flags: 'wx',
    }));
    await utimes(path, new Date(), modified.toJSDate());
    return formatAction('download', 'end', type, name);
  } catch (error) {
    // If the file was going to be overridden.
    if (error.originalError && error.originalError.code === 'EEXIST') {
      // Copy the existing file to the trash.
      const trashPath = join(directory, '.trash', name);
      await ensureDir(dirname(trashPath));
      await copy(path, trashPath);

      const body = new PassThrough();
      response.body.pipe(body);
      // Allow override this time.
      await promisePipe(body, fs.createWriteStream(path));
      await utimes(path, new Date(), modified.toJSDate());
      return formatAction('download', 'end', type, name);
    }

    // Some other error we don't know how to deal with.
    throw error;
  }
};

const shouldCopyFile = async (directory, fromName, hash) => {
  const fromPath = join(directory, fromName);
  try {
    const fileHash = await hashFromFile(fromPath, { algorithm: 'sha1' });

    // The file hash is the same, allow copy.
    if (hash === fileHash) {
      return true;
    }
  } catch (e) {
    // No such file or directory.
    if (e.code === 'ENOENT') {
      return false;
    }

    // Some other error we don't know how to deal with.
    throw e;
  }

  // Be safe, download the file.
  return false;
};

const copyFile = async (directory, name, fromName) => {
  const type = 'file';
  const path = join(directory, name);
  const fromPath = join(directory, fromName);
  try {
    await copy(fromPath, path, {
      overwrite: false,
      errorOnExist: true,
      preserveTimestamps: true,
    });
    return formatAction('copy', 'end', type, name);
  } catch (error) {
    // No such file or directory.
    if (error.code === 'ENOENT') {
      return {
        ...formatAction('copy', 'error', type, name),
        error,
      };
    }

    // Attempt to move the file to the trash first.
    try {
      // Copy the existing file to the trash.
      const trashPath = join(directory, '.trash', name);
      await ensureDir(dirname(trashPath));
      await copy(path, trashPath);

      // Allow override this time.
      await copy(fromPath, path, {
        preserveTimestamps: true,
      });
      return formatAction('copy', 'end', type, name);
    } catch (e) {
      // No such file or directory.
      if (error.code === 'ENOENT') {
        return {
          ...formatAction('copy', 'error', type, name),
          error,
        };
      }

      // Some other error we don't know how to deal with.
      throw e;
    }
  }
};

const removeFile = async (directory, name) => {
  const type = 'file';
  const path = join(directory, name);
  const trashPath = join(directory, '.trash', name);
  try {
    await ensureDir(dirname(trashPath));
    await move(path, trashPath, {
      overwrite: true,
    });
    return formatAction('remove', 'end', type, name);
  } catch (error) {
    // No such file or directory.
    if (error.code === 'ENOENT') {
      return {
        ...formatAction('remove', 'error', type, name),
        error,
      };
    }

    // Some other error we don't know how to deal with.
    throw error;
  }
};

const cleanTrash = async (directory) => {
  const trash = join(directory, '.trash');
  const threshold = DateTime.local().minus({ months: 1 });
  const files = await readdir(trash);
  const clean = files.filter(async (path) => {
    try {
      const fileStat = await stat(path);
      const fileModified = DateTime.fromJSDate(fileStat.mtime);
      if (fileModified < threshold) {
        return true;
      }
    } catch (e) {
      console.error(e);
    }

    return false;
  });

  await Promise.all(clean.map(async (name) => {
    try {
      const path = join(trash, name);
      return remove(path);
    } catch (e) {
      console.error(e);
      return Promise.reolve(undefined);
    }
  }));

  return {
    action: 'trash',
    phase: 'end',
  };
};

const resolver = (directory, oneDriveStream) => (
  oneDriveStream.pipe(
    flatMap((data) => {
      // Empty folders should be added.
      if (data.action === 'add' && data.type === 'folder') {
        return merge(
          formatAction('create', 'start', data.type, data.name),
          createFolder(directory, data.name),
        );
      }

      // Download files that have been added or changed.
      if (['add', 'change'].includes(data.action) && data.type === 'file') {
        return from(shouldDownloadFile(directory, data.name, data.hash, data.modified)).pipe(
          filter(should => !!should),
          flatMap(() => (
            merge(
              formatAction('download', 'start', data.type, data.name),
              downloadFile(directory, data.name, data.modified, data.downloadUrl),
            )
          )),
        );
      }

      if (data.action === 'move' && data.type === 'file') {
        return merge(
          formatAction('move', 'start', data.type, data.name),
          moveFile(directory, data.name, data.oldName),
        );
      }

      if (data.action === 'copy' && data.type === 'file') {
        return from(shouldCopyFile(directory, data.from, data.hash)).pipe(
          flatMap((shouldCopy) => {
            if (shouldCopy) {
              return merge(
                formatAction('copy', 'start', data.type, data.name),
                copyFile(directory, data.name, data.from),
              );
            }

            return merge(
              formatAction('download', 'start', data.type, data.name),
              downloadFile(directory, data.name, data.modified, data.downloadUrl),
            );
          }),
        );
      }

      if (data.action === 'remove' && data.type === 'file') {
        return merge(
          formatAction('remove', 'start', data.type, data.name),
          from(removeFile(directory, data.name)).pipe(
            // After the file remove is done, clean the trash.
            flatMap(() => (
              merge(
                of({
                  action: 'trash',
                  phase: 'start',
                }),
                cleanTrash(directory),
              )
            )),
          ),
        );
      }

      return empty();
    }),
    filter(item => !!item),
  )
);

module.exports = resolver;
