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
  takeUntil,
  share,
} = require('rxjs/operators');
const createFetch = require('./fetch');
const createError = require('../utils/error');
const { log } = require('../utils/logger');

const delta = (refreshToken, driveId, id, cancel = new Subject()) => {
  let link = 'https://graph.microsoft.com/v1.0/me/drive/root/delta';
  if (id && driveId) {
    link = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${id}/delta`;
  }
  const nextLink = new BehaviorSubject(link);
  const deltaLink = (new Subject()).pipe(
    delay(60000),
  );

  return merge(nextLink, deltaLink).pipe(
    takeUntil(cancel),
    flatMap(url => (
      createFetch(refreshToken)
        .then(fetch => fetch(url))
        .then((response) => {
          if (!response.ok) {
            log('warn', createError(response));
            return Promise.resolve({
              '@odata.deltaLink': url,
            });
          }

          return response.json();
        })
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
    filter(item => item.id !== id),
    share(),
  );
};

module.exports = delta;
