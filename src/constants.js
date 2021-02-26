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
  succesfulRecord: 'Recorded script',
  scan: 'Scanning html document...',
  failure: 'Operation failed. Please try refreshing the web page.',
  idle: 'Idle',
};

const instruction = `Robocorp Recorder
  Generate a Robot Framework automation script by
  – Recording actions
  – Scanning the page for automatable inputs
   Automating automation 🤖`;

const defaultLocatorOrder = ['for', 'name', 'id', 'title', 'href', 'class'];
