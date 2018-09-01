const { formatAction, formatActionSync } = require('./format-action');

test('format action sync', () => {
  const data = {
    action: 'test',
    phase: 'start',
    type: 'file',
    name: 'test.txt',
  };
  const result = formatActionSync(
    data.action,
    data.phase,
    data.type,
    data.name,
  );

  return expect(result).toEqual(data);
});

test('format action sync with error', () => {
  const data = {
    action: 'test',
    phase: 'error',
    type: 'file',
    name: 'test.txt',
    error: new Error(),
  };
  const result = formatActionSync(
    data.action,
    data.error,
    data.type,
    data.name,
  );

  return expect(result).toEqual(data);
});

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

test('format action async', () => {
  const data = {
    action: 'test',
    phase: 'start',
    type: 'file',
    name: 'test.txt',
  };
  const result = formatAction(
    data.action,
    data.phase,
    data.type,
    data.name,
  );

  return expect(result).resolves.toEqual(data);
});
