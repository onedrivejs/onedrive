const createError = ({ status, statusText }, url, data) => {
  const error = new Error(`${status} ${statusText} ${url}`);
  if (data) {
    error.data = data;
  }
  return error;
};

module.exports = createError;
