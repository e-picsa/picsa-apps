import { resolve } from 'path';
import { VideoCompressor } from './compress-video';
import { AudioNormalizer } from './normalise-audio';

// Usage
async function main() {
  const inputFolder = resolve(__dirname, 'input');
  const intermediateFolder = resolve(__dirname, 'intermediates');
  const outputFolder = resolve(__dirname, 'output');

  const normalizer = new AudioNormalizer({ inputFolder, outputFolder: intermediateFolder });
  try {
    await normalizer.processAllFiles();
    const compressor = new VideoCompressor({
      inputFolder: intermediateFolder,
      outputFolder,
    });

    await compressor.compressAll();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { VideoCompressor };
