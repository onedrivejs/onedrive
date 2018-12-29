const { sep, dirname } = require('path');

const fetchItem = async (fetch, name) => {
  const directory = dirname(name);
  const parts = name.split(sep);

  if (directory !== '.') {
    const rootFolderName = parts[0];
    const rootFolderUrl = `me/drive/root:/${encodeURIComponent(rootFolderName)}`;
    const response = await fetch(rootFolderUrl);

    if (!response.ok) {
      return response;
    }

    const rootFolderData = await response.json();

    if ('remoteItem' in rootFolderData) {
      const { driveId } = rootFolderData.remoteItem.parentReference;
      const parentId = rootFolderData.remoteItem.id;
      const urlSafeSharedName = parts.slice(1).map(part => encodeURIComponent(part)).join('/');
      const url = `drives/${driveId}/items/${parentId}:/${urlSafeSharedName}`;
      return fetch(url);
    }
  }

  const urlSafeName = parts.map(part => encodeURIComponent(part)).join('/');
  const url = `me/drive/root:/${urlSafeName}`;
  return fetch(url);
};

module.exports = fetchItem;
