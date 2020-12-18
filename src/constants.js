const url = 'https://github.com/robocorp/Robotcorder';

const tab = { active: true, currentWindow: true };

const logo = {
  stop: '/assets/icon-stop.png',
  record: '/assets/icon-record.png',
  scan: '/assets/icon-stop.png',
  action: '/assets/icon-action.png',
  pause: '/assets/icon-pause.png'
};

const filename = 'robot_script.robot';

const statusMessage = {
  stop: 'Stopped',
  record: 'Recording action...',
  scan: 'Scanning html document...',
  failed: "Operation failed. Please try refreshing. If it doesn't help, the active tab might not support recording.",
};

const instruction = `Robocorp Recorder
  Generate a Robot Framework automation script by
  * Recording actions
  * Scanning the page for automatable inputs
   Automating automation 🤗`;
