import http from 'http';

export async function waitForServerReady() {
  const isReady = await isServerReady();
  if (!isReady) {
    await sleep(2000);
    return waitForServerReady();
  }
}

export function isServerReady() {
  const options: http.RequestOptions = {
    hostname: 'localhost',
    port: 1337,
    path: '/parse',
    method: 'GET',
  };
  return new Promise((resolve) => {
    http
      .get(options)
      .on('response', () => {
        resolve(true);
      })
      .on('error', async () => {
        resolve(false);
      })
      .end();
  });
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
