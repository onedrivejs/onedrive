const { EOL } = require('os');
const { log, logAction, logReaction } = require('./logger');

jest.mock('chalk', () => ({
  gray: jest.fn().mockImplementation(text => text),
  green: jest.fn().mockImplementation(text => text),
  yellow: jest.fn().mockImplementation(text => text),
  red: jest.fn().mockImplementation(text => text),
  redBright: jest.fn().mockImplementation(text => text),
  yellowBright: jest.fn().mockImplementation(text => text),
  magentaBright: jest.fn().mockImplementation(text => text),
  blueBright: jest.fn().mockImplementation(text => text),
}));

const consoleLog = jest.spyOn(console, 'log').mockImplementation((...args) => args);
const consoleWarn = jest.spyOn(console, 'warn').mockImplementation((...args) => args);
const consoleError = jest.spyOn(console, 'error').mockImplementation((...args) => args);

test('log', () => {
  log();

  return expect(consoleLog).toHaveBeenCalled();
});

test('log info', () => {
  log('info');

  return expect(consoleLog).toHaveBeenCalled();
});

test('log warn', () => {
  log('warn');

  return expect(consoleWarn).toHaveBeenCalled();
});

test('log error', () => {
  log('error');

  return expect(consoleError).toHaveBeenCalled();
});

test('log action', () => {
  logAction({
    action: 'test',
    phase: 'start',
    type: 'symlink',
    name: 'test.txt',
    system: 'test',
  });

  return expect(consoleLog).toHaveBeenCalledWith('test symlink test.txt on test start');
});

test('log action copy', () => {
  logAction({
    action: 'copy',
    phase: 'start',
    type: 'file',
    name: 'test.txt',
    system: 'fs',
  });

  return expect(consoleLog).toHaveBeenCalledWith('Copying file test.txt on File System start');
});

test('log action download', () => {
  logAction({
    action: 'download',
    phase: 'start',
    type: 'file',
    name: 'test.txt',
    system: 'fs',
  });

  return expect(consoleLog).toHaveBeenCalledWith('Downloading file test.txt to File System start');
});

test('log action move onedrive', () => {
  logAction({
    action: 'move',
    phase: 'start',
    type: 'file',
    name: 'test.txt',
    system: 'onedrive',
  });

  return expect(consoleLog).toHaveBeenCalledWith('Moving file test.txt on OneDrive start');
});

test('log action upload onedrive', () => {
  logAction({
    action: 'upload',
    phase: 'start',
    type: 'file',
    name: 'test.txt',
    system: 'onedrive',
  });

  return expect(consoleLog).toHaveBeenCalledWith('Uploading file test.txt to OneDrive start');
});

test('log action error', () => {
  const error = new Error();
  logAction({
    action: 'upload',
    phase: 'error',
    type: 'file',
    name: 'test.txt',
    system: 'onedrive',
    error,
  });

  return expect(consoleWarn).toHaveBeenCalledWith('WARNING', `Uploading file test.txt to OneDrive${EOL}`, error);
});

test('log action clean trash', () => {
  logAction({
    action: 'clean',
    phase: 'start',
    type: 'folder',
    name: '.trash',
    system: 'fs',
  });

  return expect(consoleLog).toHaveBeenCalledWith('Cleaning folder .trash on File System start');
});

test('log action creating folder onedrive', () => {
  logAction({
    action: 'create',
    phase: 'start',
    type: 'folder',
    name: 'test',
    system: 'onedrive',
  });

  return expect(consoleLog).toHaveBeenCalledWith('Creating folder test on OneDrive start');
});

test('log action removing file onedrive', () => {
  logAction({
    action: 'remove',
    phase: 'end',
    type: 'file',
    name: 'test.txt',
    system: 'onedrive',
  });

  return expect(consoleLog).toHaveBeenCalledWith('Removing file test.txt on OneDrive end');
});

test('log action upload onedrive', () => {
  logAction({
    action: 'upload',
    phase: 'start',
    type: 'file',
    name: 'test.txt',
    system: 'onedrive',
    chunk: [1, 1],
  });

  return expect(consoleLog).toHaveBeenCalledWith('Uploading file test.txt to OneDrive start chunk 1 of 1');
});

test('log reaction', () => {
  logReaction({
    action: 'test',
    type: 'symlink',
    name: 'test.txt',
    system: 'test',
  });

  return expect(consoleLog).toHaveBeenCalledWith('Symlink test.txt was test on test');
});

test('log reaction add', () => {
  logReaction({
    action: 'add',
    type: 'file',
    name: 'test.txt',
    system: 'test',
  });

  return expect(consoleLog).toHaveBeenCalledWith('File test.txt was added on test');
});

test('log reaction change', () => {
  logReaction({
    action: 'change',
    type: 'file',
    name: 'test.txt',
    system: 'test',
  });

  return expect(consoleLog).toHaveBeenCalledWith('File test.txt was changed on test');
});

test('log reaction copy', () => {
  logReaction({
    action: 'copy',
    type: 'file',
    name: 'test.txt',
    system: 'test',
  });

  return expect(consoleLog).toHaveBeenCalledWith('File test.txt was copied on test');
});

test('log reaction move', () => {
  logReaction({
    action: 'move',
    type: 'file',
    name: 'test.txt',
    system: 'test',
  });

  return expect(consoleLog).toHaveBeenCalledWith('File test.txt was moved on test');
});

test('log reaction remove', () => {
  logReaction({
    action: 'remove',
    type: 'file',
    name: 'test.txt',
    system: 'test',
  });

  return expect(consoleLog).toHaveBeenCalledWith('File test.txt was removed on test');
});
