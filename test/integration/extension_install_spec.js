/* eslint-disable func-names */
/* eslint-disable no-console */
const { chromium } = require('playwright');
const pathLib = require('path');
const assert = require('assert');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('playwright-integration-tests', (async function () {
  this.timeout(10000);
  let browserContext;
  before(async () => {
    const pathToExtension = pathLib.join(__dirname, '../../');
    const userDataDir = 'test-user-data-dir';
    browserContext = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`
      ]
    });
    // Background pages can take some time to load
    return sleep(1000);
  });

  after(async () => browserContext.close());

  it('background page should open', async function () {
    this.timeout(5000);
    sleep(2000);

    console.log(browserContext.backgroundPages());
    const backgroundPage = browserContext.backgroundPages()[0];
    console.log(backgroundPage);
    const currentScriptOperations = await backgroundPage.evaluate(
      /* eslint-disable-next-line no-undef */
      () => this.list
    );
    console.log(currentScriptOperations);
    // return assert(currentScriptOperations.length === 0);

    // Use the background page as you would any other page.
  });
}));
