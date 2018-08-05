// This function is unnecessarily async so it doesn't have to be wrapped in
// Observable.of() everywhere.
const format = async (action, phase, type, name) => ({
  action,
  phase,
  type,
  name,
});

module.exports = format;
