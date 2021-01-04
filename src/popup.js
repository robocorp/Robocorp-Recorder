/* global document $ chrome ClipboardJS handleMessage */
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

function toggle(targetId, canSave, demo, verify, target, syntax) {
  logger.debug(targetId);
  if (targetId === 'record') {
    show(['stop', 'pause'], true);
    show(['record', 'resume', 'scan'], false);
    enable(['settings-panel'], false);
  } else if (targetId === 'pause') {
    show(['resume', 'stop'], true);
    show(['record', 'scan', 'pause'], false);
    enable(['settings-panel'], false);
  } else if (targetId === 'resume') {
    show(['pause', 'stop'], true);
    show(['record', 'scan', 'resume'], false);
    enable(['settings-panel'], false);
  } else if ((targetId === 'stop') || (targetId === 'scan')) {
    show(['record', 'scan'], true);
    show(['resume', 'stop', 'pause'], false);
    enable(['settings-panel'], true);
  } else if (targetId === 'settings') {
    analytics(['_trackEvent', 'settings', '⚙️']);
    document.getElementById('settings-panel').classList.toggle('hidden');
  }

  if ((canSave === false) || (targetId === 'record')) {
    document.getElementById('save').disabled = true;
  } else if ((canSave === true) || (targetId === 'scan') || (targetId === 'stop')) {
    document.getElementById('save').disabled = false;
  }
  if (demo) { document.getElementById('demo').checked = demo; }
  if (verify) { document.getElementById('verify').checked = verify; }
  // This is necessary to let the old settings show when user re-opens the settings modal
  if (target) { /* FIXME: select corresponding radio here */ }
  if (syntax) { /* FIXME: select corresponding radio here */ }
}

function busy(e) {
  if ((e.isBusy === true) || (e.isBusy === false)) {
    ['scan', 'record', 'stop', 'save', 'save', 'resume'].forEach((id) => {
      document.getElementById(id).disabled = e.isBusy;
    });
  }
}

function operation(e) {
  toggle(e.target.id, e.canSave, e.demo, e.target, e.syntax);
  handleMessage({ operation: e.target.id });
  // host.runtime.sendMessage({ operation: e.target.id }, display);

  analytics(['_trackEvent', e.target.id, '^-^']);
}

function updateSettings(e) {
  const demo = document.getElementById('demo').checked;
  const verify = document.getElementById('verify').checked;
  const rfbrowserRadio = document.getElementById('target_rfbrowser');
  const rpaSyntax = document.getElementById('syntax_rpa');
  const target = rfbrowserRadio.checked
    ? 'Browser'
    : 'SeleniumLibrary';
  const syntax = rpaSyntax.checked
    ? 'rpa'
    : 'testing';

  host.runtime.sendMessage({
    operation: 'settings', demo, verify, target, syntax
  });
  analytics(['_trackEvent', 'setting', e.target.id]);
}

function info() {
  host.runtime.sendMessage({ operation: 'info' });

  analytics(['_trackEvent', 'info', 'ℹ️']);
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

  ['demo', 'verify'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateSettings);
  });

  ['target', 'syntax'].forEach((cls) => {
    Array.from(document.getElementsByClassName(cls))
      .forEach(elem => elem.addEventListener('change', updateSettings));
  });

  document.getElementById('info').addEventListener('click', info);
  document.getElementById('settings').addEventListener('click', toggle);
}, false);

host.contextMenus.onClicked.addListener((clickInfo, tab) => {
  const buttonId = clickInfo.menuItemId;
  switch (buttonId) {
    case 'record' || 'resume' || 'stop' || 'pause' || 'save' || 'scan':
      operation({ target: { id: buttonId } });
      return;
    default:
      throw new Error();
  }
});

host.storage.onChanged.addListener((changes, _) => {
  for (const key in changes) {
    if (key === 'isBusy') busy({ isBusy: changes.isBusy.newValue });
    if (key === 'message') display({ message: changes.message.newValue });
  }
});
