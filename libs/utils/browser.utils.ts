/** Wait for specified period of time */
export function _wait(ms: number = Math.random() * 5000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
