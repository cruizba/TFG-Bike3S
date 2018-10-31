require('log-timestamp');
const fs = require('fs');
const { spawn } = require('child_process');
const document = './document/memory.md';
const express = require('express')
const http = require('http');
const reload = require('reload');
const path = require('path');
const app = express();

console.log(`Watching for file changes on ${document}`);
console.log(process.cwd() + "/document");

createPdf().then(() => {
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, './index.html'));
    });
    app.use('/document',express.static(__dirname + '/document'));
    app.use('/js', express.static(__dirname + '/js'));
    app.listen(3000, () => console.log('Server started at localhost:3000'));
    let server = http.createServer(app);
    let reloadServer = reload(app);
    fs.watchFile(document, (curr, prev) => {
        console.log(`${document} file Changed`);
        createCommand();
        /*
        createPdf().then(() => {
            reloadServer.reload();
        }).catch((error) => {
            console.log(error);
        })
        */
    });
})

function createCommand() {
    const commandsJson = JSON.parse(fs.readFileSync(__dirname + '/commands.json'));
    let finalCommand = '';
    for(command in commandsJson) {
        for(attribute in commandsJson[command]) {
            if(attribute === 'command') {
                finalCommand += commandsJson[command][attribute] + ' ';
            }
            if(attribute === 'parameters') {
                for(parameter of commandsJson[command][attribute]) {
                    finalCommand += commandsJson[command][attribute] + ' '
                }
            }
        }
        finalCommand += '&& '
    }
    console.log(finalCommand)
    return command;
}

function createPdf() {return new Promise((resolve, reject) => {
    console.log(createCommand());
    const command = spawn('pandoc', createCommand(), {
        cwd: process.cwd() + "/document"
    });

    command.stdout.on('data', (data) => {
        console.log(`${data}`);
    });

    command.stderr.on('data', (data) => {
        console.log(`${data}`);
    })

    command.on('error', (err) => {
        console.log('Failed to start markdown compilation.');
        console.log(err);
        reject(err);
    });

    command.on('close', () => {
        console.log("Created Pdf");
        resolve();
    })
})};