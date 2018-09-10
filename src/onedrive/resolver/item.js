const { sep, dirname } = require('path');

const fetchItem = async (fetch, name) => {
  const directory = dirname(name);
  if (directory !== '.') {
    const parts = name.split(sep);
    const rootFolderName = parts[0];
    const rootFolderUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${rootFolderName}`;
    const response = await fetch(rootFolderUrl);

    if (!response.ok) {
      return response;
    }

    const rootFolderData = await response.json();

    if ('remoteItem' in rootFolderData) {
      const { driveId } = rootFolderData.remoteItem.parentReference;
      const parentId = rootFolderData.remoteItem.id;
      const sharedName = parts.slice(1).join('/');
      const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${parentId}:/${sharedName}`;
      return fetch(url);
    }
  }

  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${name}`;
  return fetch(url);
};

module.exports = fetchItem;
