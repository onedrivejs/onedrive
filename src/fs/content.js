const { createReadStream } = require('fs');

const content = path => (
  options => createReadStream(path, options)
);

module.exports = content;
