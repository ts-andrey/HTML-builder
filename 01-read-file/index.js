const path = require('path');
const fs = require('fs');

const dirPath = path.dirname(__dirname);
const filePath = './01-read-file/text.txt';
const file = path.join(dirPath, filePath);

const rStream = fs.createReadStream(file, { encoding: 'utf-8' });
rStream.on('readable', function () {
  const data = rStream.read();
  if (data) process.stdout.write(data);
});