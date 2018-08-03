const { Subject } = require('rxjs');
const { take } = require('rxjs/operators');
const { DateTime } = require('luxon');
const createStream = require('./stream');
const delta = require('./delta');

jest.mock('./delta');

test('creating a filesystem stream', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

  expect(stream).toBeDefined();
});

test('add event', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

  const data = Promise.all([
    stream.pipe(take(1)).toPromise(),
    stream.pipe(take(2)).toPromise(),
  ]);

  subject.next({
    id: '123',
    name: 'test',
    folder: {},
    parentReference: {
      path: '/drive/root:',
    },
  });

  subject.next({
    id: '321',
    name: 'test.jpg',
    file: {
      hashes: {
        sha1Hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      },
    },
    parentReference: {
      path: '/drive/root:/test',
    },
    '@microsoft.graph.downloadUrl': 'https://example.com',
  });

  return expect(data).resolves.toEqual([
    {
      action: 'add',
      downloadUrl: null,
      id: '123',
      modified: null,
      type: 'folder',
      name: 'test',
      hash: null,
    },
    {
      action: 'add',
      id: '321',
      modified: null,
      type: 'file',
      name: 'test/test.jpg',
      hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      downloadUrl: 'https://example.com',
    },
  ]);
});

test('unhandled item type', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

  const data = stream.pipe(take(1)).toPromise();

  const expectation = expect(data).rejects.toEqual(new Error('Unhandled item type'));

  subject.next({
    id: '123',
    name: 'test',
  });

  return expectation;
});
//
//
// test('change event', () => {
//   const client = new Client();
//   const stream = createStream(client, 'data');
//   const data = stream.pipe(take(1)).toPromise();
//
//   client.emit('subscription', {
//     files: [
//       {
//         name: 'test/test.txt',
//         ino: 321,
//         'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//         type: 'f',
//         exists: true,
//         new: false,
//       },
//     ],
//   });
//
//   return expect(data).resolves.toEqual(
//     {
//       action: 'change',
//       id: 321,
//       modified: null,
//       type: 'file',
//       name: 'test/test.txt',
//       hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//     },
//   );
// });
//
// test('remove event', () => {
//   const client = new Client();
//   const stream = createStream(client, 'data');
//   const data = stream.pipe(take(1)).toPromise();
//
//   client.emit('subscription', {
//     files: [
//       {
//         name: 'test/test.txt',
//         ino: 321,
//         modified: null,
//         'content.sha1hex': null,
//         type: 'f',
//         exists: false,
//         new: false,
//       },
//     ],
//   });
//
//   return expect(data).resolves.toEqual(
//     {
//       action: 'remove',
//       id: 321,
//       modified: null,
//       type: 'file',
//       name: 'test/test.txt',
//       hash: null,
//     },
//   );
// });
//
// test('move event', () => {
//   const client = new Client();
//   const stream = createStream(client, 'data');
//   const data = stream.pipe(take(1)).toPromise();
//
//   client.emit('subscription', {
//     files: [
//       {
//         name: 'test/test.txt',
//         ino: 321,
//         'content.sha1hex': null,
//         type: 'f',
//         exists: false,
//         new: false,
//       },
//       {
//         name: 'test/test2.txt',
//         ino: 321,
//         'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//         type: 'f',
//         exists: true,
//         new: true,
//       },
//     ],
//   });
//
//   return expect(data).resolves.toEqual(
//     {
//       action: 'move',
//       id: 321,
//       modified: null,
//       type: 'file',
//       name: 'test/test2.txt',
//       hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//       oldName: 'test/test.txt',
//     },
//   );
// });
//
// test('copy event', () => {
//   const client = new Client();
//   const stream = createStream(client, 'data');
//   const data = stream.pipe(take(2)).toPromise();
//
//   client.emit('subscription', {
//     files: [
//       {
//         name: 'test/test.txt',
//         ino: 123,
//         'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//         type: 'f',
//         exists: true,
//         new: true,
//       },
//     ],
//   });
//
//   client.emit('subscription', {
//     files: [
//       {
//         name: 'test/test2.txt',
//         ino: 321,
//         'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//         type: 'f',
//         exists: true,
//         new: true,
//       },
//     ],
//   });
//
//   return expect(data).resolves.toEqual(
//     {
//       action: 'copy',
//       id: 321,
//       modified: null,
//       type: 'file',
//       name: 'test/test2.txt',
//       hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//       from: 'test/test.txt',
//     },
//   );
// });
//
// test('bogus file type', () => {
//   const client = new Client();
//   const stream = createStream(client, 'data');
//   const data = stream.pipe(take(1)).toPromise();
//
//   client.emit('subscription', {
//     files: [
//       {
//         name: 'test/test.txt',
//         ino: 321,
//         'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//         type: 'l',
//         exists: true,
//         new: false,
//       },
//     ],
//   });
//
//   return expect(data).resolves.toEqual(
//     {
//       action: 'change',
//       id: 321,
//       modified: null,
//       type: '',
//       name: 'test/test.txt',
//       hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//     },
//   );
// });
//
// test('two changes to the same file', () => {
//   const client = new Client();
//   const stream = createStream(client, 'data');
//   const data = Promise.all([
//     stream.pipe(take(1)).toPromise(),
//     stream.pipe(take(2)).toPromise(),
//   ]);
//
//   client.emit('subscription', {
//     files: [
//       {
//         name: 'test/test.txt',
//         ino: 321,
//         'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//         type: 'f',
//         exists: true,
//         new: false,
//       },
//       {
//         name: 'test/test.txt',
//         ino: 321,
//         'content.sha1hex': 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//         type: 'f',
//         exists: true,
//         new: false,
//       },
//     ],
//   });
//
//   return expect(data).resolves.toEqual([
//     {
//       action: 'change',
//       id: 321,
//       modified: null,
//       type: 'file',
//       name: 'test/test.txt',
//       hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//     },
//     {
//       action: 'change',
//       id: 321,
//       modified: null,
//       type: 'file',
//       name: 'test/test.txt',
//       hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
//     },
//   ]);
// });

test('modified time returns datetime object', () => {
  const subject = new Subject();
  delta.mockReturnValue(subject);
  const stream = createStream('1234');

  const data = stream.pipe(take(1)).toPromise();

  subject.next({
    id: '321',
    name: 'test.jpg',
    lastModifiedDateTime: '2018-07-23T16:27:17.13Z"',
    file: {
      hashes: {
        sha1Hash: 'd2047600b00eec51bf0dcf99c0bc7a77cc76152f',
      },
    },
    parentReference: {
      path: '/drive/root:/test',
    },
    '@microsoft.graph.downloadUrl': 'https://example.com',
  });

  return data.then((event) => {
    expect(event.modified).toBeInstanceOf(DateTime);
  });
});
