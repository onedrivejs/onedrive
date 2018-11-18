const createFetch = require('../fetch');
const ensureDir = require('./ensure-dir');
const createSeparator = require('../../separator');

createSeparator.mockReturnValue(jest.fn(stream => stream));

const createFolder = require('./create');

jest.mock('./ensure-dir');
jest.mock('../fetch');
jest.mock('../../separator');

jest.useFakeTimers();

const fetch = jest.fn();

createFetch.mockResolvedValue(fetch);

ensureDir.mockResolvedValue({ id: 'root', driveId: undefined });

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
