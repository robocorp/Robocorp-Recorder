/* global document $ chrome ClipboardJS */
const debug = false;
const host = chrome;
const storage = host.storage.local;

/*eslint-disable */
/* 
const gaAccount = 'UA-88380525-1';
const version = '0.3.0';
var _gaq = _gaq || [];
_gaq.push(['_setAccount', gaAccount]);
_gaq.push(['_trackPageview']);
(function() {
  var ga = document.createElement('script');
  ga.type = 'text/javascript';
  ga.async = true;
  ga.src = 'https://ssl.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(ga, s);
})();
*/
/* eslint-enable */

/*
function analytics(data) {
  const versionData = data;
  if (gaAccount) {
    versionData[2] = `${version} ${data[2]}`;
    _gaq.push(versionData);
    logger(gaAccount && versionData);
  }
}
*/
function analytics(_) {}

const logger = {
  debug: (data) => {
    host.runtime.getBackgroundPage(page => page.console.debug(data));
  },
  error: (data) => {
    host.runtime.getBackgroundPage(page => page.console.error(data));
  }
};

const clipboard = new ClipboardJS('#copy');

const copyStatus = (className) => {
  $('#copy').addClass(className);
  setTimeout(() => { $('#copy').removeClass(className); }, 3000);
};

clipboard.on('success', (e) => {
  copyStatus('copy-ok');
  analytics(['_trackEvent', 'copy', 'ok']);

  e.clearSelection();
});

clipboard.on('error', (e) => {
  copyStatus('copy-fail');
  analytics(['_trackEvent', 'copy', 'nok']);
  logger.error('Action:', e.action);
  logger.error('Trigger:', e.trigger);
});

function display(message) {
  if (message && message.message) {
    const field = document.querySelector('#textarea-script');
    field.value = message.message || '';
  }
}

function show(array, visible) {
  array.forEach((id) => {
    const element = document.getElementById(id);
    visible ? element.classList.remove('hidden') : element.classList.add('hidden');
  });
}

function enable(array, isEnabled) {
  array.forEach((id) => {
    const element = document.getElementById(id);
    isEnabled ? element.classList.remove('disabled') : element.classList.add('disabled');
  });
}

function toggle(e) {
  logger.debug(e.target.id);
  if (e.target.id === 'record') {
    show(['stop', 'pause'], true);
    show(['record', 'resume', 'scan'], false);
    enable(['settings-panel'], false);
  } else if (e.target.id === 'pause') {
    show(['resume', 'stop'], true);
    show(['record', 'scan', 'pause'], false);
    enable(['settings-panel'], false);
  } else if (e.target.id === 'resume') {
    show(['pause', 'stop'], true);
    show(['record', 'scan', 'resume'], false);
    enable(['settings-panel'], false);
  } else if ((e.target.id === 'stop') || (e.target.id === 'scan')) {
    show(['record', 'scan'], true);
    show(['resume', 'stop', 'pause'], false);
    enable(['settings-panel'], true);
  } else if (e.target.id === 'settings') {
    analytics(['_trackEvent', 'settings', '⚙️']);
    document.getElementById('settings-panel').classList.toggle('hidden');
  }

  if ((e.canSave === false) || (e.target.id === 'record')) {
    document.getElementById('save').disabled = true;
  } else if ((e.canSave === true) || (e.target.id === 'scan') || (e.target.id === 'stop')) {
    document.getElementById('save').disabled = false;
  }
  if (e.demo) { document.getElementById('demo').checked = e.demo; }
  if (e.verify) { document.getElementById('verify').checked = e.verify; }
  if (e.target) { document.getElementById('target').value = e.value; }
}

function busy(e) {
  if ((e.isBusy === true) || (e.isBusy === false)) {
    ['scan', 'record', 'stop', 'save', 'save', 'resume'].forEach((id) => {
      document.getElementById(id).disabled = e.isBusy;
    });
  }
}

function operation(e) {
  toggle(e);
  host.runtime.sendMessage({ operation: e.target.id }, display);

  analytics(['_trackEvent', e.target.id, '^-^']);
}

function settings(e) {
  const demo = document.getElementById('demo').checked;
  const verify = document.getElementById('verify').checked;
  const target = document.getElementById('target').value;
  host.runtime.sendMessage({
    operation: 'settings', demo, verify, target
  });
  analytics(['_trackEvent', 'setting', e.target.id]);
}

function info() {
  host.runtime.sendMessage({ operation: 'info' });

  analytics(['_trackEvent', 'info', 'ℹ️']);
}

function like() {
  analytics(['_trackEvent', 'like', '👍']);
}

document.addEventListener('DOMContentLoaded', () => {
  storage.get({
    message: 'Record or Scan',
    operation: 'stop',
    canSave: false,
    isBusy: false,
    demo: false,
    verify: false,
    library_target: 'SeleniumLibrary',
    locators: []
  }, (state) => {
    display({ message: state.message });
    toggle({
      target: { id: state.operation },
      canSave: state.canSave,
      isBusy: state.isBusy,
      demo: state.demo,
      verify: state.verify,
      library_target: state.library_target,
    });
  });

  debug ? document.getElementById('textarea-log').classList.remove('hidden') : 0;

  ['record', 'resume', 'stop', 'pause', 'save', 'scan'].forEach((id) => {
    document.getElementById(id).addEventListener('click', operation);
  });

  ['demo', 'verify', 'target'].forEach((id) => {
    document.getElementById(id).addEventListener('change', settings);
  });

  document.getElementById('like').addEventListener('click', like);
  document.getElementById('info').addEventListener('click', info);
  document.getElementById('settings').addEventListener('click', toggle);
}, false);

host.storage.onChanged.addListener((changes, _) => {
  for (const key in changes) {
    if (key === 'isBusy') busy({ isBusy: changes.isBusy.newValue });
    if (key === 'message') display({ message: changes.message.newValue });
  }
});
