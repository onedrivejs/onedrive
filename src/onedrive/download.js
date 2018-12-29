const createFetch = require('./fetch');

const createDownload = (refreshToken, id, driveId) => async (options) => {
  const fetch = await createFetch(refreshToken);
  return fetch(`drives/${driveId}/items/${id}/content`, options);
};

module.exports = createDownload;
