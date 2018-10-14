const fetch = require('node-fetch');
const { log } = require('../utils/logger');

const timeout = ms => (
  new Promise(resolve => setTimeout(resolve, ms))
);

const createDownload = (url, iteration = 0) => async (options) => {
  try {
    // Must await the result for the try...catch block to work.
    return await fetch(url, options);
  } catch (e) {
    const time = (2 ** iteration) * 1000;
    log('warn', e);
    await timeout(time);
    return createDownload(url, iteration + 1)(options);
  }
};

module.exports = createDownload;
