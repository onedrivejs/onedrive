const {
  Subject,
  BehaviorSubject,
  from,
  merge,
} = require('rxjs');
const {
  flatMap,
  filter,
  delay,
} = require('rxjs/operators');
const createFetch = require('./fetch');

const delta = (refreshToken) => {
  const nextLink = new BehaviorSubject('https://graph.microsoft.com/v1.0/me/drive/root/delta');
  const deltaLink = (new Subject()).pipe(
    delay(60000),
  );

  return merge(nextLink, deltaLink).pipe(
    flatMap(url => (
      createFetch(refreshToken)
        .then(fetch => fetch(url))
        .catch((e) => {
          console.error(e);
          deltaLink.next(url);
        })
        .then(response => response.json())
        .then((data) => {
          if (data['@odata.nextLink']) {
            nextLink.next(data['@odata.nextLink']);
          } else if (data['@odata.deltaLink']) {
            deltaLink.next(data['@odata.deltaLink']);
          } else {
            throw new Error('OneDrive API did not return a nextLink or deltaLink');
          }

          return data.value;
        })
    )),
    // filter out empty values.
    filter(data => !!data),
    // Convert each item into an emission.
    flatMap(data => from(data)),
    // Remove the root item.
    filter(item => !('root' in item)),
  );
};

module.exports = delta;
