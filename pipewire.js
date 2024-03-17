import { createPwThread, getInputNodes, getOutputNodes } from 'node-pipewire';
import { execSync } from "node:child_process"

async function main() {
    createPwThread();

    await new Promise((resolve) => setTimeout(resolve, 1000));

    var id = setInterval(async function () {
        var output = await getOutputNodes().find(node => node.name == "mpv")
        var input = await getInputNodes().find(node => node.name == "Chromium input")
        if (input && output) {
            execSync(`pw-link mpv:output_FR "Chromium input:input_FR"`)
            execSync(`pw-link mpv:output_FL "Chromium input:input_FL"`)
            console.log("Spawned.")
            clearInterval(id)
        }
    }, 1000)

}

main();

process.on("SIGINT", () => {
    process.exit();
});