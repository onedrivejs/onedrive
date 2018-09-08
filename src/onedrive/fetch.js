const fetch = require('node-fetch');
const client = require('./client');
const createError = require('../utils/error');
const { log } = require('../utils/logger');

const timeout = ms => (
  new Promise(resolve => setTimeout(resolve, ms))
);

const createFetch = async (refreshToken) => {
  const accessToken = await client.accessToken.create({
    refresh_token: refreshToken,
  }).refresh();

  const fetchRequest = async (input, init = {}, iteration = 0) => {
    const options = {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken.token.access_token}`,
        ...init.headers,
      },
    };

    const response = await fetch(input, options);

    if (response.status === 429) {
      const time = parseInt(response.headers.get('Retry-After'), 10) * 1000;
      log('warn', createError(response));
      await timeout(time);
      return fetchRequest(input, init, iteration + 1);
    }

    if (response.status >= 500) {
      const time = (2 ** iteration) * 1000;
      log('warn', createError(response));
      await timeout(time);
      return fetchRequest(input, init, iteration + 1);
    }

    return response;
  };

  return fetchRequest;
};

module.exports = createFetch;
