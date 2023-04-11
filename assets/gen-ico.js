const sharp = require('sharp');
const path = require('path');

const [inputFile] = process.argv.slice(2);
sharp(inputFile)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toFile(`${path.dirname(inputFile)}/${path.basename(inputFile, path.extname(inputFile))}.ico`);

sharp(inputFile)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toFile(`${path.dirname(inputFile)}/${path.basename(inputFile, path.extname(inputFile))}.png`);
