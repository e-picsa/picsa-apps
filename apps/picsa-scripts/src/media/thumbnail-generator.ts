import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface VideoProcessingOptions {
  inputFolder: string;
  outputFolder: string;
  intervalSeconds: number;
  durationSeconds: number;
  imageFormat: string;
  quality: number;

  /**
   * Generate thumbnails for videos
   *
   * Requires local install of [FFMPEG](https://www.ffmpeg.org/)
   * e.g. Windows `winget install ffmpeg`
   *
   * Place input files in local `./input` folder and run via
   *
   * ```sh
   * yarn scripts media/thumbnail-generator
   * ```
   */
}

class VideoThumbnailGenerator {
  private options: VideoProcessingOptions;

  constructor(options: Partial<VideoProcessingOptions> = {}) {
    this.options = {
      inputFolder: path.resolve(__dirname, './input'),
      outputFolder: path.resolve(__dirname, './thumbnails'),
      intervalSeconds: 10,
      durationSeconds: 120,
      imageFormat: 'jpg',
      quality: 2, // FFmpeg quality scale (1-31, lower is better)
      ...options,
    };
  }

  /**
   * Check if FFmpeg is installed and available
   */
  private checkFFmpegAvailability(): boolean {
    try {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      console.error('FFmpeg is not installed or not available in PATH. Please install FFmpeg first.');
      return false;
    }
  }

  /**
   * Get all video files from the input directory
   */
  private getVideoFiles(): string[] {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm', '.m4v'];

    if (!fs.existsSync(this.options.inputFolder)) {
      throw new Error(`Input folder does not exist: ${this.options.inputFolder}`);
    }

    const files = fs.readdirSync(this.options.inputFolder);
    return files.filter((file) => videoExtensions.some((ext) => file.toLowerCase().endsWith(ext.toLowerCase())));
  }

  /**
   * Create output directory if it doesn't exist
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.options.outputFolder)) {
      fs.mkdirSync(this.options.outputFolder, { recursive: true });
    }
  }

  /**
   * Generate thumbnails for a single video file
   */
  private async generateThumbnailsForVideo(videoFile: string): Promise<void> {
    const videoPath = path.join(this.options.inputFolder, videoFile);
    const videoName = path.parse(videoFile).name;
    const videoOutputDir = path.join(this.options.outputFolder, videoName);

    // Create video-specific output directory
    if (!fs.existsSync(videoOutputDir)) {
      fs.mkdirSync(videoOutputDir, { recursive: true });
    }

    console.log(`Processing: ${videoFile}`);

    // Calculate number of screenshots
    const numberOfScreenshots = Math.floor(this.options.durationSeconds / this.options.intervalSeconds);

    for (let i = 0; i <= numberOfScreenshots; i++) {
      const timestamp = i * this.options.intervalSeconds;
      const outputFileName = `${videoName}_${timestamp.toString().padStart(3, '0')}s.${this.options.imageFormat}`;
      const outputPath = path.join(videoOutputDir, outputFileName);

      try {
        // FFmpeg command to extract frame at specific timestamp
        const ffmpegCommand = [
          'ffmpeg',
          '-i',
          `"${videoPath}"`,
          '-ss',
          timestamp.toString(),
          '-vframes',
          '1',
          '-q:v',
          this.options.quality.toString(),
          '-y', // Overwrite output files
          `"${outputPath}"`,
        ].join(' ');

        execSync(ffmpegCommand, { stdio: 'ignore' });
        console.log(`  ✓ Generated thumbnail at ${timestamp}s`);
      } catch (error) {
        console.error(`  ✗ Failed to generate thumbnail at ${timestamp}s:`, error);
      }
    }
  }

  /**
   * Process all videos in the input folder
   */
  public async processAllVideos(): Promise<void> {
    console.log('Starting video thumbnail generation...');
    console.log(`Input folder: ${this.options.inputFolder}`);
    console.log(`Output folder: ${this.options.outputFolder}`);
    console.log(`Interval: ${this.options.intervalSeconds}s`);
    console.log(`Duration: ${this.options.durationSeconds}s`);
    console.log('---');

    // Check prerequisites
    if (!this.checkFFmpegAvailability()) {
      return;
    }

    // Ensure output directory exists
    this.ensureOutputDirectory();

    // Get all video files
    const videoFiles = this.getVideoFiles();

    if (videoFiles.length === 0) {
      console.log('No video files found in the input folder.');
      return;
    }

    console.log(`Found ${videoFiles.length} video file(s)`);

    // Process each video
    for (const videoFile of videoFiles) {
      try {
        await this.generateThumbnailsForVideo(videoFile);
        console.log(`✓ Completed: ${videoFile}\n`);
      } catch (error) {
        console.error(`✗ Failed to process ${videoFile}:`, error);
      }
    }

    console.log('Thumbnail generation completed!');
  }
}

// Usage example
async function main() {
  const generator = new VideoThumbnailGenerator({
    intervalSeconds: 5,
    durationSeconds: 60,
    imageFormat: 'jpg',
    quality: 2,
  });

  await generator.processAllVideos();
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  });
}

export { VideoThumbnailGenerator };
