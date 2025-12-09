// tests/helpers/testHelpers.ts

/**
 * Wait for a specified number of milliseconds
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Execute an async function multiple times concurrently
 */
export const executeConcurrently = async <T>(
  count: number,
  fn: (index: number) => Promise<T>
): Promise<T[]> => {
  const promises = Array.from({ length: count }, (_, i) => fn(i));
  return Promise.all(promises);
};

/**
 * Create a date string offset from now
 */
export const createDateOffset = (offsetMs: number): string => {
  return new Date(Date.now() + offsetMs).toISOString();
};

/**
 * Verify an array contains unique values
 */
export const hasUniqueValues = <T>(array: T[]): boolean => {
  return new Set(array).size === array.length;
};

/**
 * Extract property values from array of objects
 */
export const pluck = <T, K extends keyof T>(array: T[], key: K): T[K][] => {
  return array.map(item => item[key]);
};

/**
 * Assert that a promise rejects with a specific error message
 */
export const expectAsyncError = async (
  promise: Promise<any>,
  expectedMessage: string
): Promise<void> => {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error) {
    if (error instanceof Error) {
      expect(error.message).toContain(expectedMessage);
    } else {
      throw new Error('Expected an Error instance');
    }
  }
};

/**
 * Create a random string of specified length
 */
export const randomString = (length: number = 10): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Create a sequential array of numbers
 */
export const range = (start: number, end: number): number[] => {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

/**
 * Measure execution time of async function
 */
export const measureTime = async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
};

/**
 * Batch execute promises with a delay between batches
 */
export const executeBatched = async <T>(
  items: T[],
  batchSize: number,
  batchDelay: number,
  fn: (item: T) => Promise<any>
): Promise<any[]> => {
  const results: any[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    
    if (i + batchSize < items.length) {
      await delay(batchDelay);
    }
  }
  
  return results;
};

/**
 * Retry an async operation with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await delay(baseDelay * Math.pow(2, attempt));
    }
  }
  throw new Error('Max retries exceeded');
};
