class ItemTypeError extends Error {
  constructor(file, filename, ...params) {
    super(...params);
    this.message = 'Unhandled item type';
    this.file = file;
    this.filename = filename;
    this.name = 'ItemTypeError';
  }
}

module.exports = ItemTypeError;