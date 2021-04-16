const util = require('util');
const exec = util.promisify(require('child_process').exec);

const desktopIdle = require('desktop-idle');
const notifier = require('node-notifier');
const {formatDuration, intervalToDuration} = require('date-fns');

const warningTimeout = 60 * 10;
const hibernateTimeout = 60 * 15;
const pollInterval = 1 * 1000;

let prevTime = desktopIdle.getIdleTime();
let hasSentWarning = false;
let isHibernating = false;

async function runCommand(command) {
  const {stdout, stderr, error} = await exec(command);
  if (stderr) {
    console.error('stderr:', stderr);
  }
  if (error) {
    console.error('error:', error);
  }
  return stdout;
}

function durationToString(durationInSeconds) {
  return formatDuration(
    intervalToDuration({start: 0, end: durationInSeconds * 1000})
  );
}

async function hibernate() {
  const command = 'shutdown /h';
  return runCommand(command);
}

setInterval(function timerIncrement() {
  const newTime = desktopIdle.getIdleTime();

  if (newTime < prevTime && hasSentWarning) {
    if (!isHibernating) {
      notifier.notify({
        title: 'Idle timer reset!',
        message: `You've been idle for ${durationToString(
          prevTime // we use prevTime instead of newTime because newTime is near 0
        )}, but you're back so we've reset the 15 minute timer until the computer hibernates`,
      });
    }

    // reset to initial state
    hasSentWarning = false;
    isHibernating = false;
  }

  if (
    desktopIdle.getIdleTime() >= warningTimeout &&
    !hasSentWarning &&
    !isHibernating
  ) {
    notifier.notify({
      title: "You've been idle for 10 minutes!",
      message:
        'If you continue to be idle, we will automatically hibernate the computer in 5 minutes to conserve compute credits.',
    });
    hasSentWarning = true;
  }

  if (desktopIdle.getIdleTime() >= hibernateTimeout) {
    hibernate();
    isHibernating = true;
  }

  prevTime = newTime;
}, pollInterval);
