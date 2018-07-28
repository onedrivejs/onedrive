const oauth2 = require('simple-oauth2');

const client = oauth2.create({
  client: {
    id: '3fbd8409-aee4-47d1-9f09-4a5153af5f3c',
    secret: '',
  },
  auth: {
    tokenHost: 'https://login.microsoftonline.com',
    tokenPath: '/common/oauth2/v2.0/token',
    authorizePath: '/common/oauth2/v2.0/authorize',
  },
  options: {
    authorizationMethod: 'body',
  },
});

module.exports = client;
