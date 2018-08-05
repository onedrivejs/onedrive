const { DateTime } = require('luxon');
const { promisify } = require('util');
const fs = require('fs');
const { remove } = require('fs-extra');
const { join } = require('path');
const readdir = require('recursive-readdir');

const stat = promisify(fs.stat);

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

module.exports = cleanTrash;
