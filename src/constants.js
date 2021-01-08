const url = 'https://github.com/robocorp/Robotcorder';

const tab = { active: true, currentWindow: true };

const logo = {
  stop: '/assets/mark-128.png',
  record: '/assets/btn-record.svg',
  scan: '/assets/icon-target.svg',
  action: '/assets/mark-128.png',
  pause: '/assets/icon-pause.svg'
};
// This does not seem to propagate correctly to background.js
const filename = 'robot_script.robot';

const statusMessage = {
  stop: 'Stopped',
  record: 'Recording action...',
  scan: 'Scanning html document...',
  failedScan: "Scan failed. Please try refreshing. If it doesn't help, the active tab might not support recording.",
  failedRecord: 'Did not record any operations',
};

const instruction = `Robocorp Recorder
  Generate a Robot Framework automation script by
  * Recording actions
  * Scanning the page for automatable inputs
   Automating automation 🤖`;
