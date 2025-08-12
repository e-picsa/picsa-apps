import { promises as fs } from 'fs';
import path, { resolve } from 'path';
import { spawn } from 'child_process';
import { emptyDir, ensureDir } from 'fs-extra';
import cliProgress from 'cli-progress';

interface ProcessingOptions {
  inputFolder: string;
  outputFolder: string;
  targetLUFS: number;
  videoCodec: string;
  audioCodec: string;
  videoBitrate: string;
  audioBitrate: string;
  preset: string;
  crf: number;
  maxrate: string;
  bufsize: string;
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  inputFolder: resolve(__dirname, './input'),
  outputFolder: resolve(__dirname, './output'),
  targetLUFS: -14,
  videoCodec: 'libx264',
  audioCodec: 'aac',
  videoBitrate: '750k',
  audioBitrate: '128k',
  preset: 'slow',
  crf: 23,
  maxrate: '1125k',
  bufsize: '2250k',
};

class VideoProcessor {
  private options: ProcessingOptions;
  private supportedFormats = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.mpg', '.mpeg'];

  constructor(options: Partial<ProcessingOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // Simple inline duration formatter
  private formatDuration(ms: number): string {
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / (1000 * 60)) % 60;
    const hr = Math.floor(ms / (1000 * 60 * 60));
    const parts = [];
    if (hr > 0) parts.push(`${hr}h`);
    if (min > 0) parts.push(`${min}m`);
    parts.push(`${sec}s`);
    return parts.join(' ');
  }

  private async getVideoFiles(): Promise<string[]> {
    const files = await fs.readdir(this.options.inputFolder);
    return files.filter((file) => this.supportedFormats.includes(path.extname(file).toLowerCase()));
  }

  private async getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      console.log(`📏 Getting duration for: ${path.basename(filePath)}`);

      // Quote the file path to handle spaces properly
      const ffprobe = spawn(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          `"${filePath}"`, // Quote the file path
        ],
        {
          stdio: ['pipe', 'pipe', 'pipe'],
          shell: true, // Always use shell to handle quoted paths properly
        },
      );

      let output = '';
      let errorOutput = '';

      ffprobe.stdout.on('data', (data) => (output += data.toString()));
      ffprobe.stderr.on('data', (data) => (errorOutput += data.toString()));

      ffprobe.on('error', (err) => {
        reject(new Error(`Failed to spawn ffprobe: ${err.message}`));
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          const duration = parseFloat(output.trim());
          if (isNaN(duration)) {
            reject(new Error(`Invalid duration received: ${output.trim()}`));
          } else {
            console.log(`⏱️  Duration: ${this.formatDuration(duration * 1000)}`);
            resolve(duration);
          }
        } else {
          reject(new Error(`FFprobe failed with code ${code}: ${errorOutput}`));
        }
      });
    });
  }

  private generateOutputFilename(inputFile: string): string {
    const name = path.basename(inputFile, path.extname(inputFile));
    return `${name}_norm_360p.mp4`;
  }

  private buildFFmpegArgs(inputPath: string, outputPath: string): string[] {
    const { targetLUFS, videoCodec, audioCodec, videoBitrate, audioBitrate, preset, crf, maxrate, bufsize } =
      this.options;

    return [
      '-i',
      `"${inputPath}"`, // Quote input path
      '-vf',
      'scale=-2:360', // Downscale to 360p
      '-af',
      `loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11`, // Normalize audio
      '-c:v',
      videoCodec,
      '-preset',
      preset,
      '-crf',
      crf.toString(),
      '-maxrate',
      maxrate,
      '-bufsize',
      bufsize,
      '-b:v',
      videoBitrate,
      '-c:a',
      audioCodec,
      '-b:a',
      audioBitrate,
      '-ar',
      '44100',
      '-profile:v',
      'main',
      '-level',
      '3.1',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-tune',
      'film',
      '-progress',
      'pipe:2', // Force progress to stderr
      '-y',
      `"${outputPath}"`, // Quote output path
    ];
  }

  private async runFFmpeg(args: string[], filename: string, duration: number): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🎬 Starting processing: ${filename}`);

      const ffmpeg = spawn('ffmpeg', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true, // Always use shell to handle quoted paths properly
      });

      // Progress bar setup
      const bar = new cliProgress.SingleBar(
        {
          format: `⏳ {filename} |{bar}| {percentage}% | ETA: {eta_formatted} | Elapsed: {elapsed_formatted}`,
          barCompleteChar: '█',
          barIncompleteChar: '░',
          hideCursor: true,
        },
        cliProgress.Presets.shades_classic,
      );

      const startTime = Date.now();
      let progressStarted = false;

      ffmpeg.on('error', (err) => {
        console.error(`\n❌ Failed to spawn ffmpeg: ${err.message}`);
        if (progressStarted) bar.stop();
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });

      let stderrBuffer = '';

      ffmpeg.stderr.on('data', (data) => {
        stderrBuffer += data.toString();
        const lines = stderrBuffer.split('\n');
        stderrBuffer = lines.pop() || ''; // Keep the incomplete line in buffer

        for (const line of lines) {
          // More comprehensive time regex that handles microseconds
          const timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);

          if (timeMatch) {
            if (!progressStarted) {
              bar.start(100, 0, {
                filename: filename.slice(0, 30) + (filename.length > 30 ? '...' : ''),
                eta_formatted: 'calculating...',
                elapsed_formatted: this.formatDuration(0),
              });
              progressStarted = true;
            }

            const [, hh, mm, ss, microseconds] = timeMatch;
            const currentSeconds = parseInt(hh) * 3600 + parseInt(mm) * 60 + parseInt(ss);
            const progress = Math.min((currentSeconds / duration) * 100, 100);

            const elapsedMs = Date.now() - startTime;
            const remainingMs = progress > 5 ? (elapsedMs / progress) * (100 - progress) : 0;

            bar.update(Math.floor(progress), {
              eta_formatted: remainingMs > 0 ? this.formatDuration(remainingMs) : 'finishing...',
              elapsed_formatted: this.formatDuration(elapsedMs),
            });
          }
        }
      });

      ffmpeg.stdout.on('data', (data) => {
        // FFmpeg shouldn't output much to stdout, but just in case
        process.stdout.write(data);
      });

      ffmpeg.on('close', (code) => {
        if (progressStarted) {
          bar.update(100);
          bar.stop();
        }

        if (code === 0) {
          console.log(`✅ Completed: ${filename}`);
          resolve();
        } else {
          console.error(`\n❌ FFmpeg failed with code ${code} for: ${filename}`);
          reject(new Error(`FFmpeg failed with code ${code}`));
        }
      });
    });
  }

  public async processAll(): Promise<void> {
    console.log('🔍 Checking directories...');
    await ensureDir(this.options.inputFolder);
    await ensureDir(this.options.outputFolder);
    await emptyDir(this.options.outputFolder);

    const files = await this.getVideoFiles();
    if (files.length === 0) {
      console.log(`❌ No video files found in: ${this.options.inputFolder}`);
      console.log(`📁 Supported formats: ${this.supportedFormats.join(', ')}`);
      return;
    }

    console.log(`📋 Found ${files.length} file(s) to process`);
    console.log(`📂 Input folder: ${this.options.inputFolder}`);
    console.log(`📂 Output folder: ${this.options.outputFolder}`);
    console.log(`🎯 Target: 360p, ${this.options.targetLUFS} LUFS\n`);

    const totalStart = Date.now();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const inputPath = path.join(this.options.inputFolder, file);
      const outputPath = path.join(this.options.outputFolder, this.generateOutputFilename(file));

      console.log(`\n[${i + 1}/${files.length}] Processing: ${file}`);

      try {
        const duration = await this.getVideoDuration(inputPath);
        const args = this.buildFFmpegArgs(inputPath, outputPath);
        await this.runFFmpeg(args, file, duration);
      } catch (error) {
        console.error(`💥 Failed to process ${file}:`, error instanceof Error ? error.message : error);
        // Continue with next file instead of stopping
      }
    }

    console.log(`\n🎉 Processing completed in ${this.formatDuration(Date.now() - totalStart)}`);
  }
}

async function main() {
  console.log('🚀 Video Processor Starting...\n');
  const processor = new VideoProcessor();
  await processor.processAll();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('💥 Processing failed:', err);
    process.exit(1);
  });
}

export { VideoProcessor };
