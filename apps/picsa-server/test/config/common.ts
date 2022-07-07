import http from 'http';

export async function waitForServerReady() {
  const isReady = await isServerReady();
  if (!isReady) {
    await sleep(2000);
    return waitForServerReady();
  }
}

export async function waitForServerStopped() {
  const isReady = await isServerReady();
  if (isReady) {
    await sleep(2000);
    return waitForServerStopped();
  }
}

function isServerReady() {
  const options: http.RequestOptions = {
    hostname: 'localhost',
    port: 1338,
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
