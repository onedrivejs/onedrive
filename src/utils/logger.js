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

  const phaseText = phase === 'start' ? chalk.green(phase) : chalk.red(phase);

  if (chunk) {
    const [current, total] = chunk;
    const chunkText = `${current} of ${total}`;
    return log('info', `${getActionName(action)} ${type} ${fileNameText} ${getPreposition(action)} ${getSystemName(system)} ${phaseText} ${chalk.yellow('chunk')} ${chunkText}`);
  }

  return log('info', `${getActionName(action)} ${type} ${fileNameText} ${getPreposition(action)} ${getSystemName(system)} ${phaseText}`);
};

module.exports = {
  log,
  logAction,
};
