const path = require('path');
const fs = require('fs');

const toDirPath = path.dirname(__dirname);
const dirPath = './03-files-in-folder/secret-folder';
const dir = path.join(toDirPath, dirPath);

function getFiles(folder) {
  fs.readdir(folder, { withFileTypes: true }, (err, subs) => {
    if (err) return err;
    subs.forEach(sub => {
      if (sub.isDirectory());
      else {
        const [name, ext] = sub.name.split('.');
        fs.stat(path.join(folder, sub.name), (err, stats) => {
          if (err) return err;
          let size = stats.size;
          console.log(`${name} - ${ext} - ${size}b`);
        });
      }
    });
  });
}

getFiles(dir);
