const fetch = require('node-fetch');
const client = require('./client');

const createFetch = async (refreshToken) => {
  const accessToken = await client.accessToken.create({
    refresh_token: refreshToken,
  }).refresh();

  return async (input, init = {}) => {
    const options = {
      headers: {
        Authorization: `Bearer ${accessToken.token.access_token}`,
        ...init.headers,
      },
      ...init,
    };

    const response = await fetch(input, options);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response;
  };
};

module.exports = createFetch;
