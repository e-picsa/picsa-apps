import { promises as fs } from 'fs';
import path, { resolve } from 'path';
import { spawn } from 'child_process';
import { emptyDir, ensureDir } from 'fs-extra';

interface CompressionOptions {
  inputFolder: string;
  outputFolder: string;
  videoCodec: string;
  audioCodec: string;
  videoBitrate: string;
  audioBitrate: string;
  preset: string;
  crf: number;
  maxrate: string;
  bufsize: string;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  inputFolder: resolve(__dirname, './input'),
  outputFolder: resolve(__dirname, './output'),
  videoCodec: 'libx264',
  audioCodec: 'aac',
  videoBitrate: '750k', // YouTube-like bitrate for 360p
  audioBitrate: '128k',
  preset: 'slow', // Better compression efficiency
  crf: 23, // Constant Rate Factor for quality
  maxrate: '1125k', // 1.5x target bitrate for VBV
  bufsize: '2250k', // 2x maxrate for buffer
};

class VideoCompressor {
  private options: CompressionOptions;
  private supportedFormats = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'];

  constructor(options: Partial<CompressionOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Get all video files from the input directory
   */
  private async getVideoFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.options.inputFolder);
      return files.filter((file) => this.supportedFormats.includes(path.extname(file).toLowerCase()));
    } catch (error) {
      throw new Error(`Failed to read input directory: ${this.options.inputFolder}`);
    }
  }

  /**
   * Get video information using ffprobe
   */
  private async getVideoInfo(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        filePath,
      ]);

      let output = '';
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch (error) {
            reject(new Error('Failed to parse ffprobe output'));
          }
        } else {
          reject(new Error(`ffprobe failed with code ${code}`));
        }
      });

      ffprobe.on('error', reject);
    });
  }

  /**
   * Build FFmpeg arguments for YouTube-like compression
   */
  private buildFFmpegArgs(inputPath: string, outputPath: string, videoInfo: any): string[] {
    const videoStream = videoInfo.streams.find((stream: any) => stream.codec_type === 'video');

    const args = ['-i', inputPath, '-c:v', this.options.videoCodec, '-c:a', this.options.audioCodec];

    // Video settings for 360p with YouTube-like optimization
    args.push(
      '-vf',
      'scale=-2:360', // Maintain aspect ratio, height 360p
      '-preset',
      this.options.preset,
      '-crf',
      this.options.crf.toString(),
      '-maxrate',
      this.options.maxrate,
      '-bufsize',
      this.options.bufsize,
      '-b:v',
      this.options.videoBitrate,
    );

    // Audio settings
    args.push('-b:a', this.options.audioBitrate, '-ar', '44100');

    // YouTube-like encoding optimizations
    args.push(
      '-profile:v',
      'main', // H.264 Main profile
      '-level',
      '3.1', // H.264 level for 360p
      '-pix_fmt',
      'yuv420p', // Ensure compatibility
      '-movflags',
      '+faststart', // Enable progressive download
      '-tune',
      'film', // Optimize for film content
    );

    // Two-pass encoding for better quality (optional but recommended)
    // For now, using single-pass with CRF + maxrate (VBV)

    args.push('-y', outputPath); // Overwrite output file

    return args;
  }

  /**
   * Compress a single video file
   */
  private async compressVideo(inputFile: string, outputFile: string): Promise<void> {
    const inputPath = path.join(this.options.inputFolder, inputFile);
    const outputPath = path.join(this.options.outputFolder, outputFile);

    console.log(`\n🎬 Processing: ${inputFile}`);
    console.log(`📁 Output: ${outputFile}`);

    try {
      // Get video information
      const videoInfo = await this.getVideoInfo(inputPath);
      const videoStream = videoInfo.streams.find((stream: any) => stream.codec_type === 'video');

      if (!videoStream) {
        throw new Error('No video stream found');
      }

      console.log(
        `📊 Original: ${videoStream.width}x${videoStream.height} @ ${
          videoStream.bit_rate ? Math.round(videoStream.bit_rate / 1000) : 'N/A'
        }kbps`,
      );

      // Build FFmpeg arguments
      const args = this.buildFFmpegArgs(inputPath, outputPath, videoInfo);

      // Start compression
      const startTime = Date.now();
      await this.runFFmpeg(args, inputFile);
      const endTime = Date.now();

      // Get output file size
      const inputStats = await fs.stat(inputPath);
      const outputStats = await fs.stat(outputPath);
      const compressionRatio = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);

      console.log(`✅ Completed in ${((endTime - startTime) / 1000).toFixed(1)}s`);
      console.log(
        `📦 Size: ${this.formatBytes(inputStats.size)} → ${this.formatBytes(
          outputStats.size,
        )} (${compressionRatio}% reduction)`,
      );
    } catch (error) {
      console.error(`❌ Failed to compress ${inputFile}:`, error);
      throw error;
    }
  }

  /**
   * Run FFmpeg with progress tracking
   */
  private async runFFmpeg(args: string[], filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();

        // Extract progress information
        const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          const [, hours, minutes, seconds] = timeMatch;
          const currentTime = `${hours}:${minutes}:${seconds}`;
          process.stdout.write(`\r⏳ Progress: ${currentTime}`);
        }
      });

      ffmpeg.on('close', (code) => {
        process.stdout.write('\n');
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg failed with code ${code}\n${stderr}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });
    });
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Generate output filename
   */
  private generateOutputFilename(inputFile: string): string {
    const ext = path.extname(inputFile);
    const name = path.basename(inputFile, ext);
    return `${name}_360p.mp4`; // Always output as MP4
  }

  /**
   * Check if FFmpeg is available
   */
  private async checkFFmpeg(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', ['-version']);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('FFmpeg not found. Please install FFmpeg.'));
        }
      });

      ffmpeg.on('error', () => {
        reject(new Error('FFmpeg not found. Please install FFmpeg.'));
      });
    });
  }

  /**
   * Main compression function
   */
  public async compressAll(): Promise<void> {
    try {
      console.log('🔍 Checking FFmpeg availability...');
      await this.checkFFmpeg();
      console.log('✅ FFmpeg found');

      console.log('📁 Ensuring output directory exists...');
      const { outputFolder } = this.options;
      // Ensure output directory exists
      await ensureDir(outputFolder);
      await emptyDir(outputFolder);

      console.log('🔍 Scanning for video files...');
      const videoFiles = await this.getVideoFiles();

      if (videoFiles.length === 0) {
        console.log('❌ No video files found in input directory');
        return;
      }

      console.log(`📹 Found ${videoFiles.length} video file(s)`);
      console.log('🚀 Starting compression with YouTube-like settings...');
      console.log(
        `⚙️  Settings: ${this.options.videoBitrate} video, ${this.options.audioBitrate} audio, CRF ${this.options.crf}`,
      );

      for (let i = 0; i < videoFiles.length; i++) {
        const inputFile = videoFiles[i];
        const outputFile = this.generateOutputFilename(inputFile);

        console.log(`\n[${i + 1}/${videoFiles.length}]`);
        await this.compressVideo(inputFile, outputFile);
      }

      console.log('\n🎉 All videos compressed successfully!');
    } catch (error) {
      console.error('💥 Compression failed:', error);
      process.exit(1);
    }
  }
}

// Usage
async function main() {
  const compressor = new VideoCompressor();
  await compressor.compressAll();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { VideoCompressor };
