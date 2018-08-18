// This function is unnecessarily async so it doesn't have to be wrapped in
// Observable.of() everywhere.
const formatAction = async (action, phase, type, name) => {
  if (phase instanceof Error) {
    return {
      action,
      phase: 'error',
      type,
      name,
      error: phase,
    };
  }

  return {
    action,
    phase,
    type,
    name,
  };
};

module.exports = formatAction;
