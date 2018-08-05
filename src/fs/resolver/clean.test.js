const fs = require('fs');
const { promisify } = require('util');
const { remove } = require('fs-extra');
const cleanTrash = require('./clean');

const writeFile = promisify(fs.writeFile);
const utimes = promisify(fs.utimes);

jest.mock('fs');

test('clean trash', () => {
  const clean = cleanTrash('/data');

  return expect(clean).resolves.toEqual({
    action: 'clean',
    phase: 'end',
  });
});

test('clean trash with new file', async () => {
  await writeFile('/data/.trash/test.txt', 'testing');
  const clean = cleanTrash('/data');

  return expect(clean).resolves.toEqual({
    action: 'clean',
    phase: 'end',
  });
});

test('clean trash with old file', async () => {
  const path = '/data/.trash/test.txt';
  await writeFile(path, 'testing');
  await utimes(path, 100, 100);

  const clean = cleanTrash('/data');

  return expect(clean).resolves.toEqual({
    action: 'clean',
    phase: 'end',
  });
});

test('clean trash with stat failure', async () => {
  const path = '/data/.trash/test2.txt';
  await writeFile(path, 'testing');

  const clean = cleanTrash('/data');
  remove(path);

  return expect(clean).resolves.toEqual({
    action: 'clean',
    phase: 'end',
  });
});
