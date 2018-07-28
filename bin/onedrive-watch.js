#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('fb-watchman');
const { merge } = require('rxjs');
const creatFsStream = require('../src/fs/stream');
const createOneDriveStream = require('../src/onedrive/stream');

dotenv.load();

program
  .arguments('<directory>')
  .option('-rt, --refresh-token', 'OneDrive Refresh Token')
  .parse(process.argv);

const watch = () => {
  if (typeof program.args[0] === 'undefined') {
    console.error('Directory argument is missing');
    return process.exit(1);
  }

  let refreshToken;
  if (process.env.ONEDRIVE_REFRESH_TOKEN) {
    refreshToken = process.env.ONEDRIVE_REFRESH_TOKEN;
  } else if (program.refreshToken) {
    ({ refreshToken } = program);
  } else {
    console.error('No OneDrive Refresh Token Available. Create one by executing: onedrive auth');
    return process.exit(1);
  }

  const directory = path.resolve(program.args[0]);
  const fsStream = creatFsStream(new Client(), directory);
  const oneDriveStream = createOneDriveStream(refreshToken);

  return merge(fsStream, oneDriveStream).subscribe((data) => {
    console.log(data);
  });
};

// Enagage
watch();
