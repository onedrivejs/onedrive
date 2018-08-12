const { join, dirname } = require('path');
const { fromFile: hashFromFile } = require('hasha');
const { ensureDir, copy } = require('fs-extra');
const fs = require('fs');
const { DateTime } = require('luxon');
const { promisify } = require('util');
const promisePipe = require('promisepipe');
const fetch = require('node-fetch');
const { PassThrough } = require('stream');
const formatAction = require('./format');

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

const downloadFile = async (directory, name, modified, downloadUrl) => {
  const type = 'file';
  const path = join(directory, name);
  const response = await fetch(downloadUrl);

  if (!response.ok) {
    return {
      ...await formatAction('download', 'error', type, name),
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

module.exports = {
  shouldDownloadFile,
  downloadFile,
};
