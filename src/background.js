/* global chrome URL Blob */
/* global instruction filename statusMessage url tab logo initializeTranslator */

const host = chrome;

let list = [];
let script;
const storage = host.storage.local;
const content = host.tabs;
const icon = host.browserAction;
const maxLength = 5000;
let recordTab = 0;
let demo = false;
let verify = false;
let target = 'SeleniumLibrary';
let syntax = 'rpa';

// Initialize values in localStorage
storage.set({
  locators: ['for', 'name', 'id', 'title', 'href', 'class'],
  operation: 'stop',
  message: instruction,
  demo: false,
  verify: false,
  canSave: false,
  isBusy: false,
  target: 'SeleniumLibrary'
});

function selection(item) {
  if (list.length === 0) {
    list.push(item);
    return;
  }

  const prevItem = list[list.length - 1];

  if (Math.abs(item.time - prevItem.time) > 20) {
    list.push(item);
    return;
  }

  if (item.trigger === 'click') { return; }

  if ((item.trigger === 'change') && (prevItem.trigger === 'click')) {
    list[list.length - 1] = item;
    return;
  }

  list.push(item);
}

const logger = {
  debug: (data) => {
    host.runtime.getBackgroundPage(page => page.console.debug(data));
  },
  error: (data) => {
    host.runtime.getBackgroundPage(page => page.console.error(data));
  }
};

function handleError(success) {
  if (success) return;
  const lastError = host.runtime.lastError;
  if (!success && lastError) {
    logger.debug(lastError.message);
    storage.set({ message: statusMessage.failure, canSave: false });
  }
}

host.runtime.onMessage.addListener((message, sender, sendResponse) => {
  recordTab = sender.tab || message.recordTab || recordTab;
  content.query({ active: true }, (tabs) => {
    recordTab = tabs[0];
  });
  return storage.get(['target', 'syntax'], (items) => {
    const translator = initializeTranslator(items.target, items.syntax);
    let { operation } = message;
    host.runtime.getBackgroundPage(page => page.console.debug(message));

    if (operation === 'record') {
      list = [];
      icon.setIcon({ path: logo[operation] });

      list = [{
        type: 'url', path: recordTab.url, time: 0, trigger: 'record', title: recordTab.title
      }];
      storage.set({ message: statusMessage.record, operation: 'record', canSave: false });
      // FIXME: just passing handleError does not work. Need some advanced solution.
      return content.sendMessage(recordTab.id, { operation });
    } else if (operation === 'pause') {
      icon.setIcon({ path: logo.pause });

      content.sendMessage(recordTab.id, { operation: 'stop' });
      storage.set({ operation: 'pause', canSave: false, isBusy: false });
    } else if (operation === 'resume') {
      operation = 'record';

      icon.setIcon({ path: logo.record });

      content.sendMessage(recordTab.id, { operation });
      storage.set({ message: statusMessage.record, operation, canSave: false });
    } else if (operation === 'scan') {
      if (recordTab) {
        list = [{
          type: 'url', path: recordTab.url, time: 0, trigger: 'scan', title: recordTab.title
        }];
        // TODO: message.locators should be set here
        storage.set({
          message: statusMessage.scan, operation: 'scan', canSave: false, isBusy: true
        }, content.sendMessage(recordTab.id, { operation, locators: message.locators }, handleError));
      } else {
        storage.set({
          message: statusMessage.failedScan, operation: 'scan', canSave: false, isBusy: false
        });
      }
    } else if (operation === 'stop') {
      icon.setIcon({ path: logo[operation] });

      script = translator.generateOutput(list, maxLength, demo, verify);
      if (script) {
        storage.set({
          message: statusMessage.succesfulRecord, script, operation: 'stop', canSave: true
        });
        content.sendMessage(recordTab.id, { operation: 'stop' });
      } else {
        storage.set({ message: statusMessage.failedRecord, operation, canSave: false });
        content.sendMessage(recordTab.id, { operation: 'stop' });
      }
    } else if (operation === 'save') {
      const file = translator.generateFile(list, maxLength, demo, verify);
      logger.debug(file);
      const blob = new Blob([file], { type: 'text/plain;charset=utf-8' });

      host.downloads.download({
        url: URL.createObjectURL(blob, { oneTimeOnly: true }),
        filename
      });
    } else if (operation === 'settings') {
      ({
        demo, verify, target, syntax
      } = message);
      storage.set({
        demo, verify, target, syntax
      });
    } else if (operation === 'load') {
      // TODO: this is what causes scan to run after page is refreshed
      // TODO: ensure state.locators has a value
      storage.get({ operation: 'stop', locators: [] }, (state) => {
        content.sendMessage(sender.tab.id, { operation: state.operation, locators: state.locators });
      });
    } else if (operation === 'info') {
      host.tabs.create({ url });
    } else if (operation === 'append') {
      selection(message.script);
      icon.setIcon({ path: logo.action });
      setTimeout(() => { icon.setIcon({ path: logo.record }); }, 1000);
    } else if (operation === 'action') {
      icon.setIcon({ path: logo.stop });
      list = list.concat(message.scripts);
      script = translator.generateOutput(list, maxLength, demo, verify);

      storage.set({
        message: statusMessage.idle, script, operation: 'stop', isBusy: false, canSave: true
      });
    } else if (operation === 'clear-script') {
      list = [];
      storage.set({ message: 'Cleared', canSave: false });
      storage.remove('script');
    } else if (operation === 'xpath-validate') {
      content.sendMessage(recordTab.id, { operation: 'xpath-validate', xpath: message.xpath });
    } else if (operation === 'display') {
      storage.set({ message: message.message });
    }
    // https://github.com/mozilla/webextension-polyfill/issues/130 lets chrome now that our callback succeeded
    sendResponse({});
    return Promise.resolve('This should not show in console');
  });
});
