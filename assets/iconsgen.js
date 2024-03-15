const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const cp = require('node:child_process');

async function createResizedImage(inputPath, outputPath, size) {
  await sharp(inputPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toFile(outputPath);
}

async function icns(inputFile, outputDir) {
  const iconsetDir = `${os.tmpdir()}/icon.iconset`;
  await fs.promises.mkdir(iconsetDir, { recursive: true });
  for (const size of [16, 32, 128, 256, 512, 1024]) {
    await createResizedImage(inputFile, path.join(iconsetDir, `icon_${size}x${size}.png`), size);
    await createResizedImage(
      inputFile,
      path.join(iconsetDir, `icon_${size}x${size}@2x.png`),
      size * 2
    );
  }
  const icnsFile = path.join(outputDir, 'icon.icns');
  await new Promise(
    (resolve, reject) =>
      cp.exec(`iconutil --convert icns --output ${icnsFile} ${iconsetDir}`, (err) =>
        err ? reject(err) : resolve()
      ),
    { stdio: 'inherit' }
  );
  await fs.promises.rm(iconsetDir, { recursive: true });
}

// The following suffixes for DPI are also supported by Electron Forge
const dpiSuffixes = [1, 1.25, 1.33, 1.4, 1.5, 1.8, 2, 2.5, 3, 4, 5];

async function main(inputFile, outputDir) {
  await sharp(inputFile)
    .resize(24 * 3, 24 * 3, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .greyscale()
    .modulate({ brightness: 2 })
    .toFile(path.join(outputDir, 'tray@3x.png'));

  await icns(inputFile, outputDir);
  await createResizedImage(inputFile, path.join(outputDir, 'icon.ico'), 256);
  await createResizedImage(inputFile, path.join(outputDir, 'icon.png'), 256);

  for (const dpi of dpiSuffixes) {
    const size = Math.round(256 * dpi);
    await createResizedImage(inputFile, path.join(outputDir, `icon@${dpi}x.png`), size);
  }
}

const [inputFile, outputDir] = process.argv.slice(2);
main(path.resolve(inputFile), path.resolve(outputDir));
