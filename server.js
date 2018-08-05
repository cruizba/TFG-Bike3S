require('log-timestamp');

const fs = require('fs');
const { exec } = require('child_process');
const document = './document/memory.md';

console.log(`Watching for file changes on ${document}`);
console.log(process.cwd() + "/document");

fs.watchFile(document, (curr, prev) => {
    console.log(`${document} file Changed`);
    const command = exec('./create-pdf.sh', {
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
    });
});