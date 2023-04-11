const icons = require('sharp');
const path = require('path');

async function createResizedImage(inputPath, outputPath, size) {
  try {
    await icons(inputPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(outputPath);
  } catch (err) {
    console.error(`Error resizing image to ${size}x${size}:`, err);
  }
}

const [inputFile, outputDir] = process.argv.slice(2);

const sizes = [16, 24, 32, 48, 64, 96, 128, 256, 512, 1024];
async function main() {
  for (const size of sizes) {
    await createResizedImage(inputFile, path.join(outputDir, `${size}x${size}.png`), size);
    await createResizedImage(inputFile, path.join(outputDir, `${size}x${size}@2.png`), size * 2);
  }
}

main();
