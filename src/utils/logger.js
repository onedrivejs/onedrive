const chalk = require('chalk');
const { EOL } = require('os');

const getActionName = (action) => {
  switch (action) {
    case 'create':
      return 'Creating';
    case 'copy':
      return 'Copying';
    case 'move':
      return 'Moving';
    case 'upload':
      return 'Uploading';
    case 'download':
      return 'Downloading';
    case 'remove':
      return 'Removing';
    case 'clean':
      return 'Cleaning';
    default:
      return action;
  }
};

const getReactionName = (reaction) => {
  switch (reaction) {
    case 'add':
      return 'added';
    case 'change':
      return 'changed';
    case 'copy':
      return 'copied';
    case 'move':
      return 'moved';
    case 'remove':
      return 'removed';
    default:
      return reaction;
  }
};

const getPreposition = (action) => {
  if (['upload', 'download'].includes(action)) {
    return 'to';
  }

  return 'on';
};

const getSystemName = (system) => {
  switch (system) {
    case 'fs':
      return chalk.magentaBright('File System');
    case 'onedrive':
      return chalk.blueBright('OneDrive');
    default:
      return system;
  }
};

const getPhaseText = (phase) => {
  switch (phase) {
    case 'start':
      return chalk.green(phase);
    case 'end':
      return chalk.red(phase);
    case 'cancel':
      return chalk.magenta(phase);
    default:
      return phase;
  }
};

const log = (level, ...message) => {
  switch (level) {
    case 'error':
      return console.error(chalk.redBright('ERROR'), ...message);
    case 'warn':
      return console.warn(chalk.yellowBright('WARNING'), ...message);
    default:
      return console.log(...message);
  }
};

const logAction = ({
  action,
  phase,
  type,
  name,
  error,
  chunk,
  system,
}) => {
  const fileNameText = chalk.gray(name);

  if (phase === 'error') {
    return log('warn', `${getActionName(action)} ${type} ${fileNameText} ${getPreposition(action)} ${getSystemName(system)}${EOL}`, error);
  }

  if (chunk) {
    const [current, total] = chunk;
    const chunkText = `${current} of ${total}`;
    return log('info', `${getActionName(action)} ${type} ${fileNameText} ${getPreposition(action)} ${getSystemName(system)} ${getPhaseText(phase)} ${chalk.yellow('chunk')} ${chunkText}`);
  }

  return log('info', `${getActionName(action)} ${type} ${fileNameText} ${getPreposition(action)} ${getSystemName(system)} ${getPhaseText(phase)}`);
};

const capitalizeFirstLetter = string => (
  string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
);

const logReaction = ({
  action,
  type,
  name,
  system,
}) => {
  const fileNameText = chalk.gray(name);

  return log('info', `${capitalizeFirstLetter(type)} ${fileNameText} was ${getReactionName(action)} on ${getSystemName(system)}`);
};

module.exports = {
  log,
  logAction,
  logReaction,
};
