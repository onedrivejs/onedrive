const formatActionSync = (action, phase, type, name, chunk) => {
  if (phase instanceof Error) {
    return {
      action,
      phase: 'error',
      type,
      name,
      error: phase,
    };
  }

  if (typeof phase === 'function') {
    return {
      action,
      phase: 'start',
      type,
      name,
      cancel: phase,
    };
  }

  if (chunk) {
    return {
      action,
      phase,
      type,
      name,
      chunk,
    };
  }

  return {
    action,
    phase,
    type,
    name,
  };
};

// This function is unnecessarily async so it doesn't have to be wrapped in
// Observable.of() everywhere.
const formatAction = async (action, phase, type, name) => (
  formatActionSync(action, phase, type, name)
);

module.exports = {
  formatAction,
  formatActionSync,
};
