const { DateTime } = require('luxon');
const createFetch = require('../fetch');

const shouldUploadFile = async (refreshToken, name, hash, modified) => {
  const fetch = await createFetch(refreshToken);
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${name}`;
  const response = await fetch(url);
  const data = await response.json();

  const fileHash = data.file && data.file.hashes ? data.file.hashes.sha1Hash.toLowerCase() : null;

  // The file hash is the same, skip uploading.
  if (hash === fileHash) {
    return false;
  }


  if (!response.ok) {
    if (response.status === 404) {
      return true;
    }

    const error = new Error(`${response.status} ${response.statusText} ${url}`);
    error.data = data;
    throw error;
  }

  const fileModified = DateTime.fromISO(data.lastModifiedDateTime);

  // The file on OneDrive is newer, skip uploading.
  if (fileModified > modified) {
    return false;
  }

  return true;
};

const uploadFile = async (refreshtoken, name, hash, modified) => {
  console.log("UPLOAD!", name, hash, modified);
  // @TODO Implement this method... return an observable?
};

module.exports = {
  shouldUploadFile,
  uploadFile,
};
