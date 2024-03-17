(async () => {
  require('dotenv').config()

  const puppeteer = require("puppeteer-core").default
  const { spawn } = require("child_process")
  const fetch = require("node-fetch").default
  const fs = require("fs")
  const yaml = require('js-yaml');
  const config = yaml.load(fs.readFileSync("config.yaml"))
  console.log("[browser] [Info] Launching Brower")
  const browser = await puppeteer.launch({
    args: [
      '--use-fake-ui-for-media-stream',
    ],
    headless: false,
    executablePath: config.chrome.executable,
    ignoreDefaultArgs: ['--mute-audio'],
  });

  console.log("[browser] [Info] Logging in.")

  const page = await browser.newPage();
  await page.goto(`https://${config.slack.org}.slack.com/sign_in_with_password`);
  await page.type('#email', config.slack.email);
  await page.type('#password', config.slack.password);
  await Promise.all([
    page.waitForNavigation(),
    page.click("#signin_btn"),
    page.waitForNavigation(),
  ]);
  const page2 = await browser.newPage()
  await page.close()
  await page2.goto(`${config.slack.channel_url}?open=start_huddle`)
  await page2.waitForSelector('button[data-qa="huddle_from_link_speed_bump_modal_go"]', { visible: true })
  console.log("[browser] [Info] Joining huddle.")
  await page2.click(`button[data-qa="huddle_from_link_speed_bump_modal_go"]`)

  async function mpvSpawn() {
    const mpv = spawn('mpv', [config.icecast.url], {
      detached: true
    })
    try {
      spawn('bun', ['pipewire.js'], {
        detached: true
      });
    } catch (e) {
      console.error("[browser] [Warn] Linking to pipewire has not worked. This usually happens because it has already been linked.")
      console.error(e)
    }
    await fetch(`${config.api.base_url}/start?`)

    mpv.on('exit', async (code) => {
      await mpvSpawn()
    });
  }

  await mpvSpawn()

})();

process.on("SIGINT", () => {
  process.exit();
});