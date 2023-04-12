const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const os = require('os');
const cp = require('child_process');

async function createResizedImage(inputPath, outputPath, size) {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toFile(outputPath);
  } catch (err) {
    console.error(`Error resizing image to ${size}x${size}:`, err);
  }
}

async function icns(inputFile, outputDir) {
  const iconsetDir = `${os.tmpdir()}/icon.iconset`;
  await fs.promises.mkdir(iconsetDir, { recursive: true });
  for (const size of [16, 32, 128, 256, 512, 1024]) {
    await createResizedImage(
      inputFile,
      path.join(iconsetDir, `icon_${size}x${size}.png`),
      size
    );
    await createResizedImage(
      inputFile,
      path.join(iconsetDir, `icon_${size}x${size}@2.png`),
      size * 2
    );
  }
  const icnsFile = path.join(outputDir, 'icon.icns');
  await new Promise(
    (resolve, reject) =>
      cp.exec(
        `iconutil --convert icns --output ${icnsFile} ${iconsetDir}`,
        (err) => (err ? reject(err) : resolve())
      ),
    { stdio: 'inherit' }
  );
  await fs.promises.rm(iconsetDir, { recursive: true });
}

async function main(inputFile, outputDir) {
  await icns(inputFile, outputDir);
  await createResizedImage(inputFile, path.join(outputDir, 'icon.ico'), 256);
  await createResizedImage(inputFile, path.join(outputDir, 'icon.png'), 256);

  for (const size of [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024]) {
    await createResizedImage(
      inputFile,
      path.join(outputDir, 'icons', `${size}x${size}.png`),
      size
    );
    await createResizedImage(
      inputFile,
      path.join(outputDir, 'icons', `${size}x${size}@2.png`),
      size * 2
    );
  }
}

const [inputFile, outputDir] = process.argv.slice(2);
main(path.resolve(inputFile), path.resolve(outputDir));
