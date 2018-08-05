const { DateTime } = require('luxon');
const { promisify } = require('util');
const fs = require('fs');
const { ensureDir, remove } = require('fs-extra');
const { join } = require('path');
const readdir = require('recursive-readdir');

const stat = promisify(fs.stat);

const cleanTrash = async (directory) => {
  const trash = join(directory, '.trash');
  const threshold = DateTime.local().minus({ months: 1 });

  await ensureDir(trash);
  const files = await readdir(trash);
  await Promise.all(files.map(async (path) => {
    const fileStat = await stat(path);
    const fileModified = DateTime.fromJSDate(fileStat.mtime);
    if (fileModified > threshold) {
      return undefined;
    }

    return remove(path);
  }));

  return {
    action: 'clean',
    phase: 'end',
  };
};

module.exports = cleanTrash;
