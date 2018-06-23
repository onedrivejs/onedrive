#!/usr/bin/env node
const program = require('commander');
const chokidar = require('chokidar');
const hasha = require('hasha');
const path = require('path');

program
  .version('0.0.1')
  .arguments('<directory>')
  .parse(process.argv);

if (typeof program.args[0] === 'undefined') {
  console.error('Directory argument is missing');
  process.exit(1);
}

const directory = path.normalize(program.args[0]);

chokidar.watch('.', {
  ignored: /(^|[/\\])\../,
  cwd: directory,
  awaitWriteFinish: true,
}).on('all', (event, p) => {
  switch (event) {
    case 'add':
      hasha.fromFile(path.resolve(directory, p), { algorithm: 'sha1' }).then((hash) => {
        console.log(hash);
      });
      break;
    default:
      console.log(event, p);
      break;
  }
});
