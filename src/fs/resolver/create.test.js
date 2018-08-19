const { take } = require('rxjs/operators');
const { ensureDir } = require('fs-extra');
const createFolder = require('./create');

jest.mock('fs-extra');

ensureDir.mockResolvedValue(true);

test('creates a folder', () => {
  const name = 'test';
  const result = createFolder('/data', name).pipe(take(2)).toPromise();

  return expect(result).resolves.toEqual({
    action: 'create',
    phase: 'end',
    name,
    type: 'folder',
  });
});
