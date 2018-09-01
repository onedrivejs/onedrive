const fetchItem = (fetch, name) => {
  const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${name}`;
  return fetch(url);
};

module.exports = fetchItem;
