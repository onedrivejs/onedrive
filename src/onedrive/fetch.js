const fetch = require('node-fetch');
const client = require('./client');

const createFetch = async (refreshToken) => {
  const accessToken = await client.accessToken.create({
    refresh_token: refreshToken,
  }).refresh();

  return async (input, init = {}) => {
    const options = {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken.token.access_token}`,
        ...init.headers,
      },
    };

    // @TODO Deal with rate limiting and/or 500 errors.
    return fetch(input, options);
  };
};

module.exports = createFetch;
