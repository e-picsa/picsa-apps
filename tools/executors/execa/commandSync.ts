import { commandSync } from 'execa';

/**
 * Call a sync command via execa
 * Build via `npx tsc tools/executors/execa/commandSync`
 *
 * https://nx.dev/executors/creating-custom-builders
 * https://github.com/nrwl/nx/issues/8269
 *
 */
export default async function buildExecutor(options: {
  commands: string[];
  cwd?: string;
}) {
  options.commands.forEach((command) => {
    console.info(command);
    commandSync(command, {
      cwd: options.cwd,
      stdio: 'inherit',
      shell: true,
    });
  });

  return { success: true };
}
