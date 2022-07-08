export * from './parse.utils';

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
