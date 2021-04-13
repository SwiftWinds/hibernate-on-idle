const desktopIdle = require("desktop-idle");
const shutdown = require("electron-shutdown-command");
const notifier = require("node-notifier");
const { formatDuration, intervalToDuration } = require("date-fns");

const warningTimeout = 10;
const hibernateTimeout = 15;
const interval = 1 * 1000;

let prevTime = desktopIdle.getIdleTime();
let hasSentWarning = false;
let isHibernating = false;

function durationToString(durationInSeconds) {
  //   console.log(durationInSeconds);
  return formatDuration(
    intervalToDuration({ start: 0, end: durationInSeconds * 1000 })
  );
}

setInterval(function timerIncrement() {
  const newTime = desktopIdle.getIdleTime();
  //   console.log(`prevTime: ${prevTime}`);
  //   console.log(`newTime: ${newTime}`);

  if (newTime < prevTime && hasSentWarning) {
    if (!isHibernating) {
      notifier.notify({
        title: "Idle timer reset!",
        message: `You've been idle for ${durationToString(
          prevTime
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
        "If you continue to be idle, we will automatically hibernate the computer in 5 minutes to conserve compute credits.",
    });
    hasSentWarning = true;
  }

  if (desktopIdle.getIdleTime() >= hibernateTimeout) {
    shutdown.hibernate();
    // console.log("pretend we're hibernating right now");
    isHibernating = true;
  }

  prevTime = newTime;
}, interval);
