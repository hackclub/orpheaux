const nodeshout = require('nodeshout');
const YTDlpWrap = require('yt-dlp-wrap').default;
const ytDlpWrap = new YTDlpWrap('/usr/bin/yt-dlp');
const fs = require("fs")
const fsp = require('fs/promises');
const Queue = require("queue").default
const express = require('express')
const { spawn } = require("child_process")
const yaml = require('js-yaml');
const config = yaml.load(fs.readFileSync("config.yaml"))

const app = express()

const q = new Queue({ results: [], concurrency: 1 })

global.isPlaying = false

async function main() {
    nodeshout.init();
    console.log('Libshout version: ' + nodeshout.getVersion());

    const shout = nodeshout.create();
    shout.setHost(config.icecast.host);
    shout.setPort(config.icecast.port);
    shout.setUser(config.icecast.user);
    shout.setPassword(config.icecast.password);
    shout.setMount(config.icecast.mount);
    shout.setFormat(1);
    shout.setAudioInfo('bitrate', '192');
    shout.setAudioInfo('samplerate', '44100');
    shout.setAudioInfo('channels', '2');

    shout.open();

    async function play(metadata) {
        console.log(metadata)
        const fileHandle = await fsp.open(metadata.file);
        const stats = await fileHandle.stat();
        const fileSize = stats.size;
        const chunkSize = 65536;
        const buf = Buffer.alloc(chunkSize);
        let totalBytesRead = 0;

        while (totalBytesRead < fileSize) {
            const readLength = (totalBytesRead + chunkSize) <= fileSize ?
                chunkSize :
                fileSize - totalBytesRead;

            const { bytesRead } = await fileHandle.read(buf, 0, readLength, totalBytesRead);

            totalBytesRead = totalBytesRead + bytesRead;
            if (bytesRead === 0) break;
            shout.send(buf, bytesRead);
            shout.sync();
        }

        console.log('Playback ended.');

        await fileHandle.close();

    }


    app.get('/start', async function (req, res) {
        play({ file: "assets/ready.mp3" })
    })
    app.get('/stop', async function (req, res) {
        global.isPlaying = false
        q.end()
        res.json({ ok: true })
    })
    app.get('/play', async function (req, res) {
        const { url } = req.query
        var metadata = {}
        try {
            metadata = await ytDlpWrap.getVideoInfo(
                url
            )
        } catch (e) {
            console.log(e)
            return res.json({ ok: true, error: "Video not found!" })
        }
        const id = Math.random().toString(32).slice(2)
        res.json({ ok: true, ...metadata })

        ytDlpWrap
            .exec([
                url,
                '-x',
                '--audio-format',
                'mp3',
                '-o',
                `/tmp/${id}.mp3`,
            ])
            .on('close', () => {
                q.push(async cb => {
                    console.log(`[stream] [info] Playing ${metadata.title} /tmp/${id}.mp3`)
                    await play({ title: metadata.title, file: `/tmp/${id}.mp3` })
                    cb()
                })
                if (!global.isPlaying) {
                    global.isPlaying = true
                    q.start(async err => {
                        if (err) throw err
                        await play({ file: "assets/endofqueue.mp3" })
                        global.isPlaying = false
                    })
                }
            });


    })
    const listener = app.listen(config.api.port || 3000, function () {
        console.log('Listening on port ' + listener.address().port);
    });
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});