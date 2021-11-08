const path = require('path');
const fs = require('fs');

const toDirPath = path.dirname(__dirname);
const dirPath = '06-build-page';
const copyFolder = 'assets';
const stylesPath = 'styles';
const resultFolder = 'project-dist';
const componentFolder = 'components';

const dir = path.join(toDirPath, dirPath);

//После завершения работы скрипта должна быть создана папка **project-dist**
async function checkDir(directory, folder) {
  fs.readdir(directory, { withFileTypes: true }, (err, items) => {
    if (err) return err;
    if (!items.includes(folder)) fs.mkdir(path.join(directory, folder), err => err);
  });
}
checkDir(dir, resultFolder);
fs.rm(path.join(dir, resultFolder, copyFolder), { recursive: true, force: true }, err => err);
setTimeout(() => {
  checkDir(path.join(dir, resultFolder), copyFolder);
}, 50);

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

function getFiles(folderPath, pathArray, folderPathArray = []) {
  let foldersName = [];
  fs.readdir(folderPath, { withFileTypes: true }, (err, items) => {
    if (err) return err;
    for (let i = 0; i < items.length; i++) {
      const elPath = path.join(folderPath, items[i].name);
      if (items[i].isDirectory()) {
        foldersName.push(items[i].name);
        folderPathArray.push(elPath.split('assets')[1]);
      } else {
        fs.stat(elPath, (err, stats) => {
          if (err) return err;
          pathArray.push([elPath, stats.size]);
        });
      }
    }
    if (foldersName.length > 0) {
      for (let i = 0; i < foldersName.length; i++) {
        const nextPath = path.join(folderPath, foldersName[i]);
        getFiles(nextPath, pathArray);
      }
    }
  });
}

function checkFinalSize(path, size) {
  fs.stat(path, (err, stats) => {
    if (err) return err;
    if (stats) size.push(stats.size);
    else size = undefined;
  });
}
// Файл **style.css** должен содержать стили собранные из файлов папки **styles**
// В папке **project-dist** должны находиться файлы **index.html** и **style.css**
function checkStyles(pathFolder) {
  let styleArray = [];
  let stylesSize = 0;
  let finalStyleSize = [];

  getFiles(pathFolder, styleArray);
  checkFinalSize(path.join(dir, resultFolder, 'style.css'), finalStyleSize);
  setTimeout(() => {
    styleArray.forEach(el => {
      stylesSize += el[1];
    });
    if (finalStyleSize === undefined || stylesSize !== finalStyleSize[0]) {
      console.log('rewrite styles');
      fs.unlink(path.join(dir, resultFolder, 'style.css'), err => err);
      fuseFiles(
        styleArray.map(el => el[0]),
        path.join(dir, resultFolder, 'style.css')
      );
    }
  }, 50);
}
checkStyles(path.join(dir, stylesPath));

function rewrite(array) {
  array.forEach(el => {
    let readPath = el;
    let writePath = el.split('assets');
    writePath = path.join(writePath[0], resultFolder, copyFolder, writePath[1]);
    const writeStream = fs.createWriteStream(writePath, { encoding: 'binary', flags: 'w' });
    const readStream = fs.createReadStream(readPath, { encoding: 'binary' });
    readStream.on('readable', () => {
      const data = readStream.read();
      if (data) writeStream.write(`${data}`);
    });
  });
}

// В папке **project-dist** должна находиться папка **assets** являющаяся точной копией папки **assets**
function checkAssets(pathFolder) {
  let fileArray = [];
  let folderArray = [];

  getFiles(pathFolder, fileArray, folderArray);
  setTimeout(() => {
    folderArray.forEach(el => {
      checkDir(path.join(dir, resultFolder, copyFolder), el);
    });
  }, 150);
  setTimeout(() => {
    rewrite(fileArray.map(el => el[0]));
  }, 300);
}
checkAssets(path.join(dir, copyFolder));

// Файл **index.html** должен содержать разметку являющуюся результатом замены шаблонных тегов в файле **template.html**
// Запись в шаблон содержимого любых файлов кроме файлов с расширением **.html** является ошибкой
// Исходный файл **template.html** не должен быть изменён в ходе выполнения скрипта
// В папке **project-dist** должны находиться файлы **index.html** и **style.css**
function checkHtml(pathFolder) {
  let files = [];
  const pattern = path.join(dir, 'template.html');
  let htmlString;
  const readStream = fs.createReadStream(pattern, { encoding: 'binary' });
  readStream.on('readable', () => {
    const data = readStream.read();
    if (data) htmlString = data;
  });

  getFiles(pathFolder, files);
  setTimeout(() => {
    files = files.map(el => {
      if (el[0].indexOf('.html') === el[0].length - 5) return el[0];
    });
    files.forEach(el => {
      let readPath = el;
      const readStream = fs.createReadStream(readPath, { encoding: 'binary' });
      readStream.on('readable', () => {
        const data = readStream.read();
        if (data) {
          if (el.includes('header.html')) htmlString = htmlString.replace('{{header}}', `${data}`);
          if (el.includes('footer.html')) htmlString = htmlString.replace('{{footer}}', `${data}`);
          if (el.includes('articles.html')) htmlString = htmlString.replace('{{articles}}', `${data}`);
        }
      });
    });
    setTimeout(() => {
      let writePath = path.join(dir, resultFolder, 'index.html');
      const writeStream = fs.createWriteStream(writePath, { encoding: 'binary', flags: 'w' });
      writeStream.write(htmlString);
    }, 50);
  }, 100);
}
checkHtml(path.join(dir, componentFolder));
