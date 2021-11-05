const path = require('path');
const fs = require('fs');

const toDirPath = path.dirname(__dirname);
const inDirPath = './03-files-in-folder/secret-folder';
const dir = path.join(toDirPath, inDirPath);

function getFiles(folder) {
  fs.readdir(folder, { withFileTypes: true }, (err, subs) => {
    if (err) return err;
    subs.forEach(sub => {
      if (sub.isDirectory()) getFiles(path.join(folder, sub.name));
      else {
        const [name, ext] = sub.name.split('.');
        fs.stat(path.join(folder, sub.name), (err, stats) => {
          if (err) return err;
          let size = stats.size;
          size = size < 10 ** 3 ? `${size}b` : size > 10 ** 6 ? `${size / 10 ** 6}mb` : `${size / 10 ** 3}kb`;
          console.log(`${name} - ${ext} - ${size}`);
        });
      }
    });
  });
}

getFiles(dir);
