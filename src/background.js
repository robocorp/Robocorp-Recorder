/* global chrome URL Blob */
/* global instruction filename statusMessage url tab logo initializeTranslator */

const host = chrome;

let list = [];
let script;
const storage = host.storage.local;
const content = host.tabs;
const icon = host.browserAction;
const maxLength = 5000;
const recordTab = 0;
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

const handleMessage = ((message, tab, _sender, _sendResponse) => {
  storage.get(['target', 'syntax'], (items) => {
    const translator = initializeTranslator(items.target, items.syntax);
    let { operation } = message;
    host.runtime.getBackgroundPage((page) => {
      page.console.debug(operation);
    });

    if (operation === 'record') {
      icon.setIcon({ path: logo[operation] });
      list = [{
        type: 'url', path: recordTab.url, time: 0, trigger: 'record', title: recordTab.title
      }];
      content.sendMessage(tab.id, { operation });
      storage.set({ message: statusMessage[operation], operation, canSave: false });
    } else if (operation === 'pause') {
      icon.setIcon({ path: logo.pause });

      content.sendMessage(tab.id, { operation: 'stop' });
      storage.set({ operation: 'pause', canSave: false, isBusy: false });
    } else if (operation === 'resume') {
      operation = 'record';

      icon.setIcon({ path: logo[operation] });
      content.sendMessage(tab.id, { operation });
      storage.set({ message: statusMessage[operation], operation, canSave: false });
    } else if (operation === 'scan') {
      let executed = false;
      if (tab) {
        executed = true;
        list = [{
          type: 'url', path: tab.url, time: 0, trigger: 'scan', title: tab.title
        }];
        content.sendMessage(tab.id, { operation, locators: message.locators });
      }
      if (executed) {
        storage.set({
          message: statusMessage[operation], operation: 'scan', canSave: true, isBusy: true
        });
      } else {
        storage.set({
          message: statusMessage.failed, operation: 'scan', canSave: false, isBusy: false
        });
      }
    } else if (operation === 'stop') {
      icon.setIcon({ path: logo[operation] });

      script = translator.generateOutput(list, maxLength, demo, verify);
      content.sendMessage(tab.id, { operation: 'stop' });

      storage.set({ message: script, operation, canSave: true });
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
      storage.get({ operation: 'stop', locators: [] }, (state) => {
        content.sendMessage(tab.id, { operation: state.operation, locators: state.locators });
      });
    } else if (operation === 'info') {
      tab.create({ url });
    } else if (operation === 'action') {
      if (message.script) {
        selection(message.script);
        icon.setIcon({ path: logo[operation] });
        setTimeout(() => { icon.setIcon({ path: logo.record }); }, 1000);
      }

      if (message.scripts) {
        icon.setIcon({ path: logo.stop });
        list = list.concat(message.scripts);
        script = translator.generateOutput(list, maxLength, demo, verify);

        storage.set({ message: script, operation: 'stop', isBusy: false });
      }
    }
  });
  // https://stackoverflow.com/a/56483156 lets chrome now that our callback succeeded
  return false;
});
