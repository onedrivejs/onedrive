const { dirname } = require('path');
const ensureDir = require('./ensure-dir');
const createError = require('../../utils/error');

const getParentId = async (fetch, name) => {
  const directory = dirname(name);

  let parentId;
  if (directory === '.') {
    const url = 'https://graph.microsoft.com/v1.0/me/drive/items/root';
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      throw createError(response, data);
    }

    parentId = data.id;
  } else {
    parentId = await ensureDir(fetch, directory);
  }

  return parentId;
};

module.exports = getParentId;
