const createFetch = require('./fetch');

const createDownload = refreshToken => (
  url => (
    async (options) => {
      const fetch = await createFetch(refreshToken);
      return fetch(url, options);
    }
  )
);

module.exports = createDownload;
