require('log-timestamp');
const fs = require('fs-extra');
const { spawn } = require('child_process');
const document = './document/memory.md';
const express = require('express')
const http = require('http');
const reload = require('reload');
const path = require('path');
const app = express();
const rimraf = require('rimraf');

console.log(`Watching for file changes on ${document}`);
console.log(process.cwd() + "/document");

createPdf().then(() => {
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, './index.html'));
    });
    app.use('/document',express.static(__dirname + '/document'));
    app.use('/js', express.static(__dirname + '/js'));
    console.log("Created pdf");
    app.listen(3000, () => console.log('Server started at localhost:3000'));
    let server = http.createServer(app);
    let reloadServer = reload(app);
    fs.watchFile(document, (curr, prev) => {
        console.log(`${document} file Changed`);
        createCommand();

        createPdf().then(() => {
            reloadServer.reload();
        }).catch((error) => {
            console.log(error);
        })
    });
})


function createCommand() {
    const commandsJson = JSON.parse(fs.readFileSync(__dirname + '/commands.json'));
    let commandsList = [];
    for(command in commandsJson) {
        let commandForSpawn = {
            command: '',
            args: []
        }
        for(attribute in commandsJson[command]) {
            if(attribute === 'command') {
                commandForSpawn.command = commandsJson[command][attribute];
            }
            if(attribute === 'parameters') {
                for(parameter of commandsJson[command][attribute]) {
                    commandForSpawn.args.push(parameter);
                }
            }
        }
        console.log(commandForSpawn)
        commandsList.push(commandForSpawn);
    }
    return commandsList;
}

function executeCommand(commandForSpawn) {
    return new Promise((resolve, reject) => {
        const command = spawn(commandForSpawn.command, commandForSpawn.args, {
            cwd: process.cwd() + "/document"
        });
    
        command.stdout.on('data', (data) => {
            console.log(`${data}`);
        });
    
        command.stderr.on('data', (data) => {
            console.log(`${data}`);
        })
    
        command.on('error', (err) => {
            console.log(`Failed to start ${commandString}`);
            console.log(err);
            reject(err);
        });
    
        command.on('close', () => {
            resolve();
        });
    });
} 

function createPdf() {return new Promise(async (resolve, reject) => {
    //Create temp folder if it doesn't exists
    if(fs.existsSync(__dirname + '/document/temp')) {
        await rimraf(__dirname + '/document/temp', () => console.log("Temp folder deleted"));
    }
    fs.mkdirSync(__dirname + '/document/temp');
    let commandsList = createCommand();
    console.log(commandsList);
    for(commandForSpawn of commandsList) {
        await executeCommand(commandForSpawn);
    }
    await rimraf(__dirname + '/document/temp', () => console.log("Temp folder deleted"));
    resolve();
})};