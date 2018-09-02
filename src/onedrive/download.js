const fetch = require('node-fetch');

const createDownload = url => (
  options => fetch(url, options)
);

module.exports = createDownload;
