#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const createWatcher = require('./src/fs/create-watcher');
const createStream = require('./src/fs/create-stream');

program
  .version('0.0.1')
  .arguments('<directory>')
  .parse(process.argv);

if (typeof program.args[0] === 'undefined') {
  console.error('Directory argument is missing');
  process.exit(1);
}

const directory = path.normalize(program.args[0]);

const watcher = createWatcher(directory);
const stream = createStream(watcher);

stream.subscribe((data) => {
  console.log(data);
});
