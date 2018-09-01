const fetchItem = require('./item');

const fetch = jest.fn()
  .mockResolvedValue({});

test('fetch item', () => {
  const result = fetchItem(fetch, 'text.txt');
  return expect(result).resolves.toEqual({});
});
