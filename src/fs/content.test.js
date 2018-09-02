const { createReadStream } = require('fs');
const content = require('./content');

jest.mock('fs');

const mockReadStream = {};
createReadStream.mockReturnValue(mockReadStream);

test('create content', () => {
  const result = content('/tmp/test.txt')();

  return expect(result).toEqual(mockReadStream);
});
