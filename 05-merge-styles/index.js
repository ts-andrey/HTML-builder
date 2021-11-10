const path = require('path');
const fs = require('fs/promises');

const toDirPath = path.dirname(__dirname);
const dirPath = '05-merge-styles';
const stylesPath = 'styles';
const resultPath = 'project-dist';

const styleDir = path.join(toDirPath, dirPath, stylesPath);
const finalDir = path.join(toDirPath, dirPath, resultPath);

async function setInitialState() {
  try {
    await fs.rm(path.join(finalDir, 'bundle.css'), { recursive: true, force: true, maxRetries: 9 }, err => err);
  } catch (err) {
    return err;
  }
}

async function getDirItems(dir) {
  const names = [];
  const isFolders = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    items.map(el => {
      names.push(el.name);
      isFolders.push(el.isDirectory());
    });
  } catch (err) {
    return err;
  }
  return [names, isFolders];
}

async function writeData(readPath, writePath) {
  try {
    const data = await fs.readFile(readPath, { encoding: 'binary' });
    await fs.writeFile(writePath, data, { encoding: 'binary', flag: 'a' });
  } catch (err) {
    return err;
  }
}

async function replicate(item) {
  try {
    const [styleItems, styleTypes] = await getDirItems(item);
    const finalPath = path.join(finalDir, 'bundle.css');
    for (let i = 0; i < styleItems.length; i++) {
      const itemPath = path.join(item, styleItems[i]);
      let ext = styleItems[i].split('.');
      if (ext[ext.length - 1] === 'css') {
        if (!styleTypes[i]) await writeData(itemPath, finalPath);
      }
      if (styleTypes[i]) await replicate(itemPath);
    }
  } catch (err) {
    return err;
  }
}

async function merge() {
  try {
    await setInitialState();
    await replicate(styleDir);
  } catch (err) {
    return err;
  }
}
merge();
