class ResolveError extends Error {
  constructor(file, filename, message) {
    super(message);
    this.file = file;
    this.filename = filename;
    this.name = 'ResolveError';
  }
}

module.exports = ResolveError;
