import { promises as fs } from 'fs';
import path, { resolve } from 'path';
import { spawn } from 'child_process';
import { emptyDir, ensureDir } from 'fs-extra';

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

  private async getVideoFiles(): Promise<string[]> {
    const files = await fs.readdir(this.options.inputFolder);
    return files.filter((file) => this.supportedFormats.includes(path.extname(file).toLowerCase()));
  }

  private generateOutputFilename(inputFile: string): string {
    const name = path.basename(inputFile, path.extname(inputFile));
    return `${name}_norm_360p.mp4`;
  }

  private async runFFmpeg(args: string[], filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
        const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          const [, h, m, s] = timeMatch;
          process.stdout.write(`\r⏳ ${filename} → ${h}:${m}:${s}`);
        }
      });

      ffmpeg.on('close', (code) => {
        process.stdout.write('\n');
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg failed with code ${code}\n${stderr}`));
      });

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg spawn error: ${err.message}`));
      });
    });
  }

  private buildFFmpegArgs(inputPath: string, outputPath: string): string[] {
    const { targetLUFS, videoCodec, audioCodec, videoBitrate, audioBitrate, preset, crf, maxrate, bufsize } =
      this.options;

    return [
      '-i',
      inputPath,
      '-vf',
      'scale=-2:360', // Downscale to 360p
      '-af',
      `loudnorm=I=${targetLUFS}:TP=-1.5:LRA=11:print_format=summary`, // Normalize audio
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
      '-y',
      outputPath,
    ];
  }

  public async processAll(): Promise<void> {
    await ensureDir(this.options.outputFolder);
    await emptyDir(this.options.outputFolder);

    const files = await this.getVideoFiles();
    if (files.length === 0) {
      console.log('❌ No video files found.');
      return;
    }

    console.log(`📋 Found ${files.length} file(s) to process`);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const inputPath = path.join(this.options.inputFolder, file);
      const outputPath = path.join(this.options.outputFolder, this.generateOutputFilename(file));

      console.log(`\n[${i + 1}/${files.length}] 🎬 ${file}`);
      const start = Date.now();
      const args = this.buildFFmpegArgs(inputPath, outputPath);
      await this.runFFmpeg(args, file);
      const end = Date.now();
      console.log(`✅ Done in ${((end - start) / 1000).toFixed(1)}s`);
    }

    console.log('\n🎉 All files processed successfully!');
  }
}

async function main() {
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
