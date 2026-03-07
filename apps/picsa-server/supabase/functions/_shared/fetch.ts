/**
 * Executes a fetch request with exponential backoff and jitter.
 *
 * @param url The target URL
 * @param options The RequestInit object (method, headers, body, etc.)
 * @param retries Maximum number of attempts
 * @param initialDelay Starting delay in milliseconds
 * @returns Promise<Response> - Always returns a response, even if all attempts fail
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 5,
  initialDelay = 2000,
): Promise<Response> {
  let lastResponse: Response = new Response(JSON.stringify({ error: 'Max retries reached' }), {
    status: 504,
    statusText: 'Gateway Timeout',
  });

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      lastResponse = response;

      // 1. Success: Return immediately
      if (response.ok) {
        return response;
      }

      // 2. Retryable errors (Overpass specific):
      // 429: Too Many Requests (Rate limit)
      // 504: Gateway Timeout (Server busy)
      if (response.status === 429 || response.status === 504) {
        if (i < retries - 1) {
          // Exponential backoff: 2s, 4s, 8s...
          // Adding Jitter: Random 0-1000ms to prevent thundering herd
          const jitter = Math.random() * 1000;
          const delay = initialDelay * Math.pow(2, i) + jitter;

          console.warn(`Attempt ${i + 1} failed with ${response.status}. Retrying in ${Math.round(delay)}ms...`);

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      } else {
        // Non-retryable errors (e.g., 400 Bad Request, 403 Forbidden)
        // Break the loop and return the error response
        break;
      }
    } catch (err) {
      console.error(`Attempt ${i + 1} encountered a network error:`, err);
      // If we have no response yet and encounter a network error, we continue to retry
      if (i === retries - 1) {
        return new Response(JSON.stringify({ error: 'Network failure' }), {
          status: 500,
          statusText: 'Internal Server Error',
        });
      }
      await new Promise((resolve) => setTimeout(resolve, initialDelay * Math.pow(2, i)));
    }
  }

  return lastResponse;
}
