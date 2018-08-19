#!/usr/bin/env node
const program = require('commander');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('fb-watchman');
const creatFsStream = require('../src/fs/stream');
const fsResolver = require('../src/fs/resolver/resolver');
const createOneDriveStream = require('../src/onedrive/stream');
const oneDriveResolver = require('../src/onedrive/resolver/resolver');

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

  createOneDriveStream(refreshToken).pipe(
    fsResolver(directory),
  ).subscribe((data) => {
    console.log('FILESYSTEM', data);
  });

  creatFsStream(new Client(), directory).pipe(
    oneDriveResolver(refreshToken),
  ).subscribe((data) => {
    console.log('ONEDRIVE', data);
  });
};

// Enagage
watch();
