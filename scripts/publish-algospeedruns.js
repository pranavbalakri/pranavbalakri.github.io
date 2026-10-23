// Copy the app into the existing static website output. No network or deployment.
const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, '../apps/algospeedruns/dist');
const target = path.join(__dirname, '../public/algospeedruns');
if (!fs.existsSync(path.join(source, 'index.html'))) throw new Error('Build Algo Speedruns first.');
fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });
console.log('Algo Speedruns copied to public/algospeedruns.');
