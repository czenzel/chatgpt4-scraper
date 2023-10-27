// /Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --remote-debugging-port=9222

const CDP = require('chrome-remote-interface');
const fs = require('fs');
const yargs = require('yargs');
const argv = yargs.argv;

const cdp_js_content = fs.readFileSync('cdp.js', 'utf8');

async function getOutput(input) {
    let client, outputHtml
    try {
        client = await CDP();

        // Extract used domains.
        const { DOM, Runtime } = client;

        // Ensure the DOM is fully loaded.
        const document = await DOM.getDocument();

        // Define the script that will be evaluated on the page.
        const scriptToEvaluate = `${cdp_js_content}submitForm('${input}');`;

        // Execute the script on the page.
        const result = await Runtime.evaluate({ 
            expression: scriptToEvaluate, 
            awaitPromise: true  // This tells CDP to wait for the promise to resolve
        });

        if (result.result.objectId) {
            const properties = await Runtime.getProperties({ objectId: result.result.objectId });
            outputHtml = await Runtime.evaluate({expression: 'document.body.getElementsByClassName("markdown")[document.body.getElementsByClassName("markdown").length - 1].innerHTML'});
        }

    } catch (err) {
        console.error(err);
    } finally {
        if (client) {
            await client.close();
        }
        return outputHtml.value.value;
    }
    
}

async function run() {
    let query = argv.query
    const output = await getOutput(query)
    console.log(`output: ${output}`)
}

run();
