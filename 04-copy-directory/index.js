const path = require('path');
const fs = require('fs');

const toDirPath = path.dirname(__dirname);
const dirPath = './04-copy-directory';
const folderPath = '/files';

const dir = path.join(toDirPath, dirPath, folderPath);

function getCopyPath(folder, item = '') {
  if (folder && !folder.includes('files-copy')) {
    if (item === '') return path.join(folder.replace('files', 'files-copy'));
    else return path.join(folder.replace('files', 'files-copy'), item);
  } else {
    if (item === '') return folder;
    else return path.join(folder, item);
  }
}

async function checkDir(collection, currentDirectory, newFolder) {
  if (!collection.includes(newFolder)) {
    const folderPath = getCopyPath(currentDirectory, newFolder);
    await fs.mkdir(folderPath, err => err);
  }
}

function rewrite(folder, item) {
  const rStream = fs.createReadStream(path.join(folder, item), { encoding: 'binary' });
  const wStream = fs.createWriteStream(getCopyPath(folder, item), { encoding: 'binary' });
  rStream.on('readable', function () {
    const data = rStream.read();
    if (data) wStream.write(`${data}`);
  });
}

function getFileInfo(array, position, folderPath, isName = false, result = new Set()) {
  const cash = result;
  let currPath;
  if (isName) currPath = getCopyPath(folderPath);
  else currPath = folderPath;

  let folderName = '';
  let folderPosition;

  for (let i = position; i < array.length; i++) {
    if (array[i].isDirectory()) {
      folderName = array[i].name;
      folderPosition = i;
      if (isName) {
        cash.add({ name: array[i].name, path: getCopyPath(currPath, array[i].name) });
      } else {
        cash.add(path.join(currPath, array[i].name));
      }
    } else {
      if (isName) {
        cash.add({ name: array[i].name, path: getCopyPath(currPath, array[i].name) });
      } else {
        cash.add(path.join(currPath, array[i].name));
      }
    }
  }
  if (folderName !== '') {
    if (isName) {
      return getFileInfo(array, ++folderPosition, currPath, true, cash);
    } else {
      return getFileInfo(array, ++folderPosition, currPath, false, cash);
    }
  }
  return cash;
}

async function checkRemoved(array, copyArray, folder) {
  const newArr = new Array(...getFileInfo(array, 0, folder, false, new Set()));
  const newArrCopy = getFileInfo(copyArray, 0, folder, true, new Set());
  await newArrCopy.forEach(el => {
    let tempPath = el.path;
    tempPath = tempPath.replace('files-copy', 'files');
    if (!newArr.includes(tempPath)) fs.rm(el.path, { recursive: true, force: true }, err => err);
  });
}

async function changeCheck(array, copyArray, folder) {
  await array.forEach((item, index) => {
    if (item.isDirectory()) {
      checkDir(copyArray, folder, item.name);
      copyFiles(path.join(folder, item.name));
    } else {
      if (copyArray[index] && array[index].name === copyArray[index].name) {
        fs.stat(path.join(folder, array[index].name), (err, stats) => {
          if (err) return err;
          fs.stat(getCopyPath(path.join(folder, copyArray[index].name)), (err, copyStats) => {
            if (err) return err;
            if (stats.size !== copyStats.size) {
              rewrite(folder, item.name);
            }
          });
        });
      } else rewrite(folder, item.name);
    }
  });
}

async function changesHandler(array, copyArray, folder) {
  await checkRemoved(array, copyArray, folder);
  await changeCheck(array, copyArray, folder);
}

async function copyFiles(folder) {
  await fs.readdir(folder, { withFileTypes: true }, (err, items) => {
    checkDir(items, dirPath, 'files-copy');
    if (err) return err;
    fs.readdir(getCopyPath(folder), { withFileTypes: true }, (err, itemsCopy) => {
      if (err) return err;
      changesHandler(items, itemsCopy, folder);
    });
  });
}

copyFiles(dir);
