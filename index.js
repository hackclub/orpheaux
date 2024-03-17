require('dotenv').config()
const { App } = require('@slack/bolt');
const fetch = require("node-fetch").default
const { spawn } = require("child_process")
const fs = require("fs")
const yaml = require('js-yaml');
const config = yaml.load(fs.readFileSync("config.yaml"))
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    appToken: process.env.SLACK_APP_TOKEN,
    socketMode: true
});
global.browserLaunched = false;

app.command('/play', async ({ ack, command, respond }) => {
    await ack();
    if (!command.text) return await respond("Please provide a YouTube URL or Video ID.")
    const resp = await fetch(`${config.api.base_url}/play?` + new URLSearchParams({ url: command.text.trim() }))
    const json = await resp.json()
    await respond(json.ok ? `Now playing ${json.title}` : json.error);
});

app.command('/stop', async ({ ack, respond }) => {
    await ack();
    const resp = await fetch(`${config.api.base_url}/stop`)
    const json = await resp.json()
    await respond(json.ok ? "Stopped." : json.error);
});

app.command('/launch', async ({ ack, respond }) => {

    await ack();
    if (global.browserLaunched) return await respond("Bot has already joined.")
    global.browserLaunched = true;
    await respond("Joining...")
    const browser = spawn('node', ['browser.js'], {
        detached: true
    });
    browser.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    browser.stderr.on('data', (data) => {
        console.log(data.toString());
    });
    browser.on('exit', (data) => {
        global.browserLaunched = false;

    });
 
});

(async () => {
    await app.start();
    console.log('⚡️ Bolt app is running!');
})();