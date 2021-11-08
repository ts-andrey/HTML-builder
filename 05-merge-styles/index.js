const path = require('path');
const fs = require('fs');

const toDirPath = path.dirname(__dirname);
const dirPath = '05-merge-styles';
const stylesPath = 'styles';
const resultPath = 'project-dist';

const dir = path.join(toDirPath, dirPath);

let pathArr = [];
let stylesSize = 0;
let finalSize = 0;

function fuseFiles(files, finalFile) {
  const writeStream = fs.createWriteStream(finalFile, { encoding: 'binary', flags: 'a' });
  files.forEach(el => {
    const readStream = fs.createReadStream(el, { encoding: 'binary' });
    readStream.on('readable', () => {
      const data = readStream.read();
      if (data) writeStream.write(`${data}`);
    });
  });
}

function getFiles(folderPath) {
  let foldersName = [];
  fs.readdir(folderPath, { withFileTypes: true }, (err, items) => {
    if (err) return err;
    for (let i = 0; i < items.length; i++) {
      if (items[i].isDirectory()) {
        foldersName.push(items[i].name);
      } else {
        if (items[i].name.split('.')[1] === 'css') {
          const elPath = path.join(folderPath, items[i].name);
          pathArr.push(elPath);
          fs.stat(elPath, (err, stats) => {
            if (err) return err;
            stylesSize += stats.size;
          });
        }
      }
    }

    if (foldersName.length > 0) {
      for (let i = 0; i < foldersName.length; i++) {
        const nextPath = path.join(folderPath, foldersName[i]);
        getFiles(nextPath);
      }
    }
  });
}

function checkFinalSize(path) {
  fs.stat(path, (err, stats) => {
    if (err) return err;
    finalSize = stats.size;
  });
}

async function mergeStyles() {
  const jobPath = path.join(dir, stylesPath);
  const finalPath = path.join(dir, resultPath, 'bundle.css');

  getFiles(jobPath);
  checkFinalSize(finalPath);

  setTimeout(() => {
    if (finalSize === 0) {
      console.log('created');
      fuseFiles(pathArr, finalPath);
    } else if (finalSize - stylesSize !== 0) {
      console.log('rewrited');
      fs.unlink(finalPath, err => err);
      fuseFiles(pathArr, finalPath);
    }
  }, 50);
}
mergeStyles();
