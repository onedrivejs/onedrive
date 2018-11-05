const fetch = require('node-fetch');
const client = require('./client');
const createError = require('../utils/error');
const { log } = require('../utils/logger');

const timeout = ms => (
  new Promise(resolve => setTimeout(resolve, ms))
);

const createFetch = async (refreshToken) => {
  const fetchAccessToken = async (iteration = 0) => {
    try {
      // Must await the result for the try...catch block to work.
      return await client.accessToken.create({
        refresh_token: refreshToken,
      }).refresh();
    } catch (e) {
      const time = (2 ** iteration) * 1000;
      log('warn', e.message);
      await timeout(time);
      return fetchAccessToken(iteration + 1);
    }
  };

  const accessToken = await fetchAccessToken();

  const fetchRequest = async (input, init = {}, iteration = 0) => {
    const options = {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken.token.access_token}`,
        ...init.headers,
      },
    };

    try {
      const response = await fetch(input, options);

      if (response.status === 429) {
        const time = parseInt(response.headers.get('Retry-After'), 10) * 1000;
        log('warn', createError(response).message);
        await timeout(time);
        return fetchRequest(input, init, iteration + 1);
      }

      if (response.status >= 500) {
        const time = (2 ** iteration) * 1000;
        log('warn', createError(response).message);
        await timeout(time);
        return fetchRequest(input, init, iteration + 1);
      }

      return response;
    } catch (e) {
      const time = (2 ** iteration) * 1000;
      log('warn', e.message);
      await timeout(time);
      return fetchRequest(input, init, iteration + 1);
    }
  };

  return fetchRequest;
};

module.exports = createFetch;
