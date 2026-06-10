import { supabase } from './supabase';

const WORKERS_URL = process.env.NEXT_PUBLIC_WORKERS_URL!;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Makes an authenticated request to the Cloudflare Workers API.
 * Automatically attaches the current Supabase session JWT.
 */
export const workersApi = async <T = any>(
  path: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: Record<string, unknown>;
  } = {}
): Promise<T> => {
  const { method = 'POST', body } = options;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const maxAttempts = 3;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${WORKERS_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (err) {
        const trimmed = responseText.trim();
        const cleanText = trimmed.replace(/^"|"$/g, '');
        if (cleanText === 'true') {
          data = true;
        } else if (cleanText === 'false') {
          data = false;
        } else if (!isNaN(Number(cleanText)) && cleanText !== '') {
          data = Number(cleanText);
        } else if (cleanText) {
          data = {
            id: cleanText,
            value: cleanText,
            uploadUrl: cleanText,
            objectKey: cleanText,
            available: cleanText === 'true' || cleanText === 'available'
          };
          Object.defineProperty(data, 'toString', {
            value: () => cleanText,
            writable: true,
            configurable: true
          });
        } else {
          data = {};
        }
      }

      if (!response.ok) {
        if (response.status >= 500 && attempt < maxAttempts) {
          throw new Error(data?.error || `Server error ${response.status}`);
        }
        throw new Error(data?.error || `Request failed with status ${response.status}`);
      }

      return data as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      if (attempt < maxAttempts) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1);
        await delay(backoffMs);
      }
    }
  }

  throw lastError || new Error('Request failed');
};
