const { defer, from } = require('rxjs');
const { flatMap } = require('rxjs/operators');
const createFetch = require('./fetch');

const stream = refreshToken => (
  defer(async () => {
    // @TODO Recursively call with a `delta` until everything is retrieved.
    const fetch = await createFetch(refreshToken);
    const response = await fetch('https://graph.microsoft.com/v1.0/me/drive/root/delta');
    const data = await response.json();
    return data.value;
  }).pipe(
    // @TODO Normalize what is returned from OneDrive.
    flatMap(items => from(items)),
  )
  // @TODO Add a timer to check every so often for new changes.
);

module.exports = stream;
