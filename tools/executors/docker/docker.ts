import { commandSync } from 'execa';

/**
 * Call docker cli commands
 * Build via `yarn tsc tools/executors/docker/docker`
 * */
export default async function buildExecutor(options: {
  commands: string[];
  cwd?: string;
}) {
  for (const command of options.commands) {
    console.info(`docker ${command}`);
    commandSync(`docker ${command}`, {
      cwd: options.cwd,
      stdio: 'inherit',
      shell: true,
    });
  }

  return { success: true };
}
