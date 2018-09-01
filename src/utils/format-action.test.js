const { formatActionSync } = require('./format-action');

test('format action sync with chunk', () => {
  const data = {
    action: 'test',
    phase: 'start',
    type: 'file',
    name: 'test.txt',
    chunk: [1, 30],
  };
  const result = formatActionSync(
    data.action,
    data.phase,
    data.type,
    data.name,
    data.chunk,
  );

  return expect(result).toEqual(data);
});
