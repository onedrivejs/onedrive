const createFolder = require('./create');
const ensureDir = require('./ensure-dir');

jest.mock('./ensure-dir');
jest.useFakeTimers();

ensureDir.mockResolvedValue('root');

test('creates a folder in the root', () => {
  const name = 'test';
  const result = createFolder('abcd', name).toPromise();

  return expect(result).resolves.toEqual({
    action: 'create',
    phase: 'end',
    type: 'folder',
    name,
  });
});
