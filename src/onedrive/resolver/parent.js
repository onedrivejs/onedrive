const { dirname } = require('path');
const ensureDir = require('./ensure-dir');
const createError = require('../../utils/error');

const getParent = async (fetch, name) => {
  const directory = dirname(name);

  let parent;
  if (directory === '.') {
    const url = 'me/drive/items/root';
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw createError(response, data);
    }

    parent = {
      id: data.id,
      driveId: data.parentReference.driveId,
    };
  } else {
    parent = await ensureDir(fetch, directory);
  }

  return parent;
};

module.exports = getParent;
