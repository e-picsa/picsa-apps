import * as fs from 'fs/promises';
import * as path from 'path';
import { spawn } from 'child_process';

interface ProcessingResult {
  inputFile: string;
  outputFile: string;
  success: boolean;
  error?: string;
}

const inputFolder = './input';
const outputFolder = './output';
const targetLUFS = -14;

/**
 * Normalise audio levels of local media files
 *
 * Requires local install of [FFMPEG](https://www.ffmpeg.org/)
 * e.g. Windows `winget install ffmpeg`
 *
 * Place input files in local `./input` folder and run via
 *
 * ```sh
 * yarn scripts media/normalise-audio
 * ```
 */
class AudioNormalizer {
  private readonly inputFolder: string;
  private readonly outputFolder: string;
  private readonly targetLUFS: number;
  private readonly supportedExtensions: Set<string>;

  constructor() {
    this.inputFolder = path.resolve(__dirname, inputFolder);
    this.outputFolder = path.resolve(__dirname, outputFolder);
    this.targetLUFS = targetLUFS;
    this.supportedExtensions = new Set([
      '.mp4',
      '.avi',
      '.mov',
      '.mkv',
      '.wmv',
      '.flv',
      '.webm',
      '.m4v',
      '.mpg',
      '.mpeg',
    ]);
  }

  /**
   * Ensures the output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.access(this.outputFolder);
    } catch {
      await fs.mkdir(this.outputFolder, { recursive: true });
      console.log(`Created output directory: ${this.outputFolder}`);
    }
  }

  /**
   * Gets all video files from the input directory
   */
  private async getVideoFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.inputFolder);
      return files.filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return this.supportedExtensions.has(ext);
      });
    } catch (error) {
      throw new Error(`Failed to read input directory: ${this.inputFolder}. ${error}`);
    }
  }

  /**
   * Measures the current LUFS of a video file
   */
  private async measureLUFS(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-i', filePath, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg failed with code ${code}`));
          return;
        }

        try {
          // Extract JSON from stderr
          const jsonMatch = stderr.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            reject(new Error('Could not find loudnorm JSON output'));
            return;
          }

          const loudnormData = JSON.parse(jsonMatch[0]);
          const inputI = parseFloat(loudnormData.input_i);
          resolve(inputI);
        } catch (error) {
          reject(new Error(`Failed to parse loudnorm output: ${error}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg process error: ${error}`));
      });
    });
  }

  /**
   * Normalizes audio in a video file to target LUFS
   */
  private async normalizeAudio(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`Processing: ${path.basename(inputPath)}`);

      const ffmpeg = spawn('ffmpeg', [
        '-i',
        inputPath,
        '-af',
        `loudnorm=I=${this.targetLUFS}:TP=-1.5:LRA=11:print_format=summary`,
        '-c:v',
        'copy', // Copy video stream without re-encoding
        '-y', // Overwrite output file if it exists
        outputPath,
      ]);

      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        // Only log important information, not all ffmpeg output
        if (output.includes('Input Integrated:') || output.includes('error')) {
          console.log(output.trim());
        }
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Completed: ${path.basename(outputPath)}`);
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with exit code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg process error: ${error}`));
      });
    });
  }

  /**
   * Processes a single video file
   */
  private async processFile(fileName: string): Promise<ProcessingResult> {
    const inputPath = path.join(this.inputFolder, fileName);
    const outputPath = path.join(this.outputFolder, fileName);

    try {
      // Check if output file already exists
      try {
        await fs.access(outputPath);
        console.log(`⚠️  Skipping ${fileName} - output file already exists`);
        return {
          inputFile: fileName,
          outputFile: fileName,
          success: true,
        };
      } catch {
        // File doesn't exist, proceed with processing
      }

      // Measure current LUFS
      const currentLUFS = await this.measureLUFS(inputPath);
      console.log(`📊 ${fileName}: Current LUFS = ${currentLUFS.toFixed(2)}, ` + `Target = ${this.targetLUFS}`);

      // Normalize audio
      await this.normalizeAudio(inputPath, outputPath);

      return {
        inputFile: fileName,
        outputFile: fileName,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to process ${fileName}: ${errorMessage}`);
      return {
        inputFile: fileName,
        outputFile: fileName,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Processes all video files in the input directory
   */
  async processAllFiles(): Promise<ProcessingResult[]> {
    console.log(`🎬 Audio Normalizer - Target: ${this.targetLUFS} LUFS`);
    console.log(`📁 Input folder: ${this.inputFolder}`);
    console.log(`📁 Output folder: ${this.outputFolder}`);
    console.log('─'.repeat(50));

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Get all video files
      const videoFiles = await this.getVideoFiles();

      if (videoFiles.length === 0) {
        console.log('⚠️  No video files found in input directory');
        return [];
      }

      console.log(`📋 Found ${videoFiles.length} video file(s) to process`);
      console.log('─'.repeat(50));

      // Process files sequentially to avoid overwhelming the system
      const results: ProcessingResult[] = [];
      for (const file of videoFiles) {
        const result = await this.processFile(file);
        results.push(result);
      }

      // Summary
      const successful = results.filter((r) => r.success).length;
      const failed = results.length - successful;

      console.log('─'.repeat(50));
      console.log(`🎉 Processing complete!`);
      console.log(`✅ Successful: ${successful}`);
      console.log(`❌ Failed: ${failed}`);

      if (failed > 0) {
        console.log('\n❌ Failed files:');
        results.filter((r) => !r.success).forEach((r) => console.log(`   - ${r.inputFile}: ${r.error}`));
      }

      return results;
    } catch (error) {
      console.error('💥 Fatal error:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const normalizer = new AudioNormalizer();

  try {
    await normalizer.processAllFiles();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Run the script if this file is executed directly
if (require.main === module) {
  main();
}

export { AudioNormalizer };
