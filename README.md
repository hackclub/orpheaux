# Orpheaux

A bot which can play YouTube music over Slack Huddles.

Orpheaux is very much in alpha. It also has only been tested on Fedora 39 Desktop. I've tried to make it run on Ubuntu Server and Fedora Server, it won't work.

## Requirements:
- pactl
- pulseaudio
- pw-link
- bun
- node.js
- mpv
- mpvc
- an icecast2 server

## Get started
```bash
# Clone this repo
git clone https://github.com/hackclub/orpheaux

# Install dependencies (don't use bun)
yarn install

# Copy the config
cp config.yaml.example config.yaml

# Edit the config
nano config.yaml

# Start the streaming service (won't work in bun)
node stream

# Start the slack bot (won't work in bun)
node index
```

## Structure
- `stream.js` - Streams music to the icecast server.
- `index.js` - Slack bot which controls the icecast server.
- `browser.js` - Connect to slack and plays music.
- `pipewire.js` - Called by `browser.js` to link `mpv` and Slack together.