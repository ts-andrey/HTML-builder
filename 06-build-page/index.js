const path = require('path');
const fs = require('fs/promises');

const toDirPath = path.dirname(__dirname);
const dirPath = '06-build-page';
const copyFolder = 'assets';
const stylesPath = 'styles';
const resultFolder = 'project-dist';
const componentFolder = 'components';

const dir = path.join(toDirPath, dirPath);

// helper functions
async function getDirItems(dir, dataType = '') {
  const names = [];
  const isFolders = [];
  try {
    const items = await fs.readdir(dir, { withFileTypes: true });
    items.map(el => {
      if (dataType !== '') {
        let ext = el.name.split('.');
        if (ext[ext.length - 1] === dataType) {
          names.push(el.name);
          isFolders.push(el.isDirectory());
        }
      } else {
        names.push(el.name);
        isFolders.push(el.isDirectory());
      }
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

// working logic
async function setInitialState() {
  try {
    const [arr, types] = await getDirItems(dir);
    if (arr.includes(resultFolder))
      await fs.rm(path.join(dir, resultFolder), { recursive: true, force: true, maxRetries: 9 }, err => err);
    await fs.mkdir(path.join(dir, resultFolder));
  } catch (err) {
    return err;
  }
}

async function replicate(item, copy) {
  try {
    await fs.mkdir(copy);
    const [assetItems, assetTypes] = await getDirItems(item);
    for (let i = 0; i < assetItems.length; i++) {
      const itemPath = path.join(item, assetItems[i]);
      const copyPath = path.join(copy, assetItems[i]);
      if (!assetTypes[i]) await writeData(itemPath, copyPath);
      if (assetTypes[i]) await replicate(itemPath, copyPath);
    }
  } catch (err) {
    return err;
  }
}

async function mergeStyles(folder) {
  try {
    const [styleItems, styleTypes] = await getDirItems(folder, 'css');
    for (let i = 0; i < styleItems.length; i++) {
      const itemPath = path.join(folder, styleItems[i]);
      const resultPath = path.join(dir, resultFolder, 'style.css');
      if (!styleTypes[i]) await writeData(itemPath, resultPath);
      if (styleTypes[i]) await mergeStyles(itemPath);
    }
  } catch (err) {
    return err;
  }
}

async function makePage(folder) {
  try {
    const [compItems, compTypes] = await getDirItems(folder, 'html');
    let template = path.join(dir, 'template.html');
    let data = await fs.readFile(path.join(dir, 'template.html'), { encoding: 'binary' });
    const resultPath = path.join(dir, resultFolder, 'index.html');
    await writeData(template, resultPath);
    for (let i = 0; i < compItems.length; i++) {
      if (!compTypes[i]) {
        const itemPath = path.join(folder, compItems[i]);
        const tempData = await fs.readFile(itemPath, { encoding: 'binary' });
        data = data.replace(`{{${compItems[i].replace('.html', '')}}}`, tempData);
      }
    }
    await fs.writeFile(resultPath, data, { encoding: 'binary' });
  } catch (err) {
    return err;
  }
}

async function build() {
  try {
    await setInitialState();
    await replicate(path.join(dir, copyFolder), path.join(dir, resultFolder, copyFolder));
    await mergeStyles(path.join(dir, stylesPath));
    await makePage(path.join(dir, componentFolder));
  } catch (err) {
    return err;
  }
}
build();
