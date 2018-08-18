const { basename } = require('path');
const createFetch = require('../fetch');
const formatAction = require('../../utils/format-action');

const createFolder = async (refreshToken, name) => {
  // @TODO The documentation implies that you can provide the path,
  //       but that doesn't seem to be the case. We'll have to recurisvely
  //       create folders until we get to where we want to be.
  const base = basename(name);
  let parent = '';
  if (base.length !== name.length) {
    parent = `/${name.substring(0, name.length - base.length - 1)}`;
  }
  const fetch = await createFetch(refreshToken);
  const url = `https://graph.microsoft.com/v1.0/me/drive/items/root${parent}/children`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      folder: {},
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(`${response.status} ${response.statusText} ${url}`);
    error.data = data;
    return formatAction('create', error, 'folder', name);
  }

  return formatAction('create', 'end', 'folder', name);
};

module.exports = createFolder;
