const path = require('path');
const readline = require('readline');
const fs = require('fs');

const dirPath = path.dirname(__dirname);
const filePath = './02-write-file/text.txt';
const file = path.join(dirPath, filePath);

const wStream = fs.createWriteStream(file, { flags: 'a', encoding: 'utf-8' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.setPrompt("(file) 'fill me with your fantasies': ");
rl.prompt();
rl.on('line', function (line) {
  if (line.toLowerCase().trim() === 'exit') rl.close();
  else {
    wStream.write(`${line}\n`);
    rl.prompt();
  }
});

rl.on('close', () => console.log("\n(file) 'end of the filling, good by!'"));