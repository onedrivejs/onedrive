const { join, dirname, extname } = require('path');
const { tmpdir } = require('os');
const {
  from,
  merge,
  EMPTY,
  Subject,
} = require('rxjs');
const { flatMap } = require('rxjs/operators');
const { fromFile: hashFromFile } = require('hasha');
const {
  ensureDir,
  move,
  copy,
  remove,
} = require('fs-extra');
const fs = require('fs');
const { DateTime } = require('luxon');
const { promisify } = require('util');
const promisePipe = require('promisepipe');
const { PassThrough } = require('stream');
const { monotonicFactory } = require('ulid');
const createError = require('../../utils/error');
const { formatAction, formatActionSync } = require('../../utils/format-action');

const ulid = monotonicFactory();
const stat = promisify(fs.stat);
const utimes = promisify(fs.utimes);

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

const downloadFile = (directory, name, hash, modified, downloader) => {
  const type = 'file';
  const path = join(directory, name);

  return from(shouldDownloadFile(directory, name, hash, modified)).pipe(
    flatMap((should) => {
      if (!should) {
        return EMPTY;
      }

      const result = new Subject();
      const reject = (reason) => {
        result.error(reason);
        result.complete();
        return reason;
      };
      const resolve = (action) => {
        result.next(action);
        result.complete();
        return action;
      };
      const cancel = () => (
        resolve(formatActionSync('download', 'cancel', type, name))
      );

      Promise.resolve().then(async () => {
        const response = await downloader();

        // There is no way to abort the download in node-fetch, so abort after
        // it is done.
        if (result.isStopped) {
          return false;
        }

        if (!response.ok) {
          return resolve(formatActionSync('download', createError(response), type, name));
        }

        const tmpPath = join(tmpdir(), ulid().toLowerCase() + extname(path));
        const body = new PassThrough();
        response.body.pipe(body);
        await promisePipe(body, fs.createWriteStream(tmpPath, {
          flags: 'wx',
        }));
        await utimes(tmpPath, new Date(), modified.toJSDate());

        // If the request has been aborted, delete the file and end.
        if (result.isStopped) {
          await remove(tmpPath);
          return false;
        }

        try {
          await ensureDir(dirname(path));
          await move(tmpPath, path);
          return resolve(formatActionSync('download', 'end', type, name));
        } catch (error) {
          // Copy the existing file to the trash.
          const trashPath = join(directory, '.trash', name);
          await ensureDir(dirname(trashPath));
          await copy(path, trashPath);

          // Allow override this time.
          await ensureDir(dirname(path));
          await move(tmpPath, path, {
            overwrite: true,
          });
          return resolve(formatActionSync('download', 'end', type, name));
        }
      }).catch(e => reject(e));

      return merge(
        formatAction('download', cancel, type, name),
        result,
      );
    }),
  );
};

module.exports = downloadFile;
