const {
  concat,
  from,
  EMPTY,
} = require('rxjs');
const { flatMap, catchError } = require('rxjs/operators');
const { DateTime } = require('luxon');
const { promisify } = require('util');
const fs = require('fs');
const { remove } = require('fs-extra');
const { join, relative } = require('path');
const readdir = require('recursive-readdir');
const { formatAction } = require('../../utils/format-action');

const stat = promisify(fs.stat);

const cleanTrash = (directory) => {
  const name = '.trash';
  const action = 'clean';
  const type = 'folder';
  const trash = join(directory, '.trash');
  const threshold = DateTime.local().minus({ months: 1 });

  return concat(
    formatAction(action, 'start', type, name),
    from(readdir(trash)).pipe(
      // Create a new emmit from each path.
      flatMap(paths => from(paths)),
      flatMap((path) => {
        const fileName = relative(directory, path);

        return from(stat(path)).pipe(
          flatMap((fileStat) => {
            const fileModified = DateTime.fromJSDate(fileStat.mtime);

            if (fileModified < threshold) {
              return concat(
                formatAction(action, 'start', type, path),
                Promise.resolve().then(async () => {
                  try {
                    await remove(path);
                    return formatAction(action, 'end', 'file', fileName);
                  } catch (e) {
                    return formatAction(action, e, 'file', fileName);
                  }
                }),
              );
            }

            return EMPTY;
          }),
          catchError(() => EMPTY),
        );
      }),
    ),
    formatAction(action, 'end', type, name),
  );
};

module.exports = cleanTrash;
