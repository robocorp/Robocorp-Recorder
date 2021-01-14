/* global document $ chrome ClipboardJS chardinJs */
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
  debug: (data, rest) => {
    host.runtime.getBackgroundPage(page => page.console.debug(data, rest));
  },
  error: (data, rest) => {
    host.runtime.getBackgroundPage(page => page.console.error(data, rest));
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

function updateValueByMessage(elementId, message) {
  if (message || message === '') {
    const field = document.querySelector(elementId);
    field.innerText = message.toString();
  } else {
    logger.debug(`Tried to update value of ${elementId} by ${message}`);
  }
}

function displayScript(message) {
  updateValueByMessage('#script-output', message);
}

function displayStatus(message) {
  updateValueByMessage('#status-field', message);
}


function show(ids, visible) {
  const elements = ids.map(id => document.getElementById(id));

  elements.forEach((elem) => {
    if (elem) visible ? elem.classList.remove('hidden') : elem.classList.add('hidden');
    else logger.errror('Tried to toggle visibility of non-existent element');
  });
}

function hide(array) {
  show(array, false);
}

function enable(array, isEnabled) {
  array.forEach((id) => {
    const element = document.getElementById(id);
    isEnabled ? element.classList.remove('disabled') : element.classList.add('disabled');
  });
}

function toggleHidden(id) {
  document.getElementById(id).classList.toggle('hidden');
}

function setActive(id) {
  document.getElementById(id).classList.add('btn-active');
}

function setInactive(array) {
  array.forEach((id) => {
    document.getElementById(id).classList.remove('btn-active');
  });
}

function toggle(e) {
  logger.debug(e.target.id);
  // Hide all buttons by default and explicitly show buttons to show
  if (e.target.id !== 'clear-script') {
    hide(['record', 'scan', 'pause', 'xpath-console', 'resume', 'stop', 'script-container']);
    enable(['settings-panel'], false);
  }

  if (e.target.id === 'pause') {
    show(['resume', 'stop'], true);
  } else if (e.target.id === 'resume' || e.target.id === 'record') {
    show(['pause', 'stop', 'status-field'], true);
    hide(['settings-panel', 'xpath-inputs'], true);
    setInactive(['xpath-console', 'settings', 'scan']);
  } else if (e.target.id === 'stop') {
    show(['record', 'scan', 'xpath-console', 'status-field', 'script-container'], true);
    hide(['xpath-inputs', 'settings-panel'], true);
    setInactive(['xpath-console', 'settings', 'scan']);
  } else if (e.target.id === 'settings') {
    show(['record', 'scan', 'xpath-console', 'settings-panel'], true);
    hide(['script-container', 'xpath-inputs', 'status-field'], true);
    setActive('settings');
    setInactive(['scan', 'xpath-console']);
  } else if (e.target.id === 'xpath-console') {
    show(['record', 'scan', 'xpath-console', 'xpath-inputs', 'status-field'], true);
    hide(['settings-panel']);
    setInactive(['settings', 'scan']);
    setActive('xpath-console');
  } else if (e.target.id === 'scan') {
    show(['record', 'scan', 'xpath-console', 'status-field', 'script-container'], true);
    hide(['xpath-inputs', 'settings-panel'], true);
    setActive('scan');
    setInactive(['xpath-console', 'settings']);
  }

  if ((e.canSave === false) || (e.target.id === 'record')) {
    document.getElementById('save').disabled = true;
    document.getElementById('copy').disabled = true;
  } else if ((e.canSave === true) && (e.target.id === 'scan' || e.target.id === 'stop')) {
    document.getElementById('save').disabled = false;
    document.getElementById('copy').disabled = false;
  }
  if (e.demo) { document.getElementById('demo').checked = e.demo === true; }
  if (e.verify) { document.getElementById('verify').checked = e.verify === true; }

  if (e.library_target) {
    const rfbrowserSelected = e.library_target === 'Browser';
    document.getElementById('target_rfbrowser').checked = rfbrowserSelected;
    document.getElementById('target_seleniumlibrary').checked = !rfbrowserSelected;
  }
  if (e.syntax) {
    const rpaSelected = e.syntax === 'rpa';
    document.getElementById('syntax_rpa').checked = rpaSelected;
    document.getElementById('syntax_testing').checked = !rpaSelected;
  }
}

function busy(e) {
  if ((e.isBusy === true) || (e.isBusy === false)) {
    ['scan', 'record', 'stop', 'save', 'save', 'copy', 'resume'].forEach((id) => {
      document.getElementById(id).disabled = e.isBusy;
    });
  }
}

function operation(e) {
  toggle(e);
  // FIXME: change in displayStatus signature is reason why now status sometimes shows Object object.
  // Go back to old signature or figure out other way around
  host.runtime.sendMessage({ operation: e.target.id }, displayStatus);
  analytics(['_trackEvent', e.target.id, '^-^']);
}

function xpathValidate(event) {
  const xpath = document.getElementById('textinput-xpath').value;
  host.runtime.sendMessage({ operation: 'xpath-validate', xpath });
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

function info(e) {
  $('body').data('chardinJs').toggle();
}

document.addEventListener('DOMContentLoaded', () => {
  storage.get({
    message: 'Record or Scan',
    operation: 'idle',
    canSave: false,
    isBusy: false,
    demo: false,
    verify: false,
    target: 'SeleniumLibrary',
    syntax: 'rpa',
    locators: [],
    script: '',
  }, (state) => {
    displayStatus(state.message);
    displayScript(state.script);
    // FIXME: rename target to current operation and toggle's first param to `state` instead of `e`
    toggle({
      target: { id: state.operation },
      canSave: state.canSave,
      isBusy: state.isBusy,
      demo: state.demo,
      verify: state.verify,
      library_target: state.target,
      syntax: state.syntax,
    });
  });

  debug ? document.getElementById('textarea-log').classList.remove('hidden') : 0;

  [
    'record',
    'resume',
    'stop',
    'pause',
    'save',
    'scan',
    'xpath-console',
    'settings',
    'clear-script',
  ].forEach((id) => {
    document.getElementById(id).addEventListener('click', operation);
  });

  ['demo', 'verify'].forEach((id) => {
    document.getElementById(id).addEventListener('change', updateSettings);
  });

  ['target', 'syntax'].forEach((cls) => {
    Array.from(document.getElementsByClassName(cls))
      .forEach(elem => elem.addEventListener('change', updateSettings));
  });

  document.getElementById('textinput-xpath').addEventListener('input', xpathValidate);
  $('body').chardinJs();
  document.getElementById('info').addEventListener('click', info);
}, false);

host.storage.onChanged.addListener((changes, _) => {
  logger.debug('Localstorage event, changes: ', changes);
  for (const key in changes) {
    const newValue = changes[key].newValue;
    if (key === 'isBusy') busy({ isBusy: newValue });
    if (key === 'message') displayStatus(newValue);
    if (key === 'script') displayScript(newValue || '');
  }
});
