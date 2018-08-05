const createFolder = require('./create');

jest.mock('fs-extra');

test('creates a folder', () => {
  const name = 'test';

  return expect(createFolder('/data', name)).resolves.toEqual({
    action: 'create',
    phase: 'end',
    name,
    type: 'folder',
  });
});
