#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const createStream = require('./src/fs/stream');

program
  .version('0.0.1')
  .arguments('<directory>')
  .parse(process.argv);

if (typeof program.args[0] === 'undefined') {
  console.error('Directory argument is missing');
  process.exit(1);
}

const directory = path.resolve(program.args[0]);

const stream = createStream(directory);

stream.subscribe((data) => {
  console.log(data);
});
