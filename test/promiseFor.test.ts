import { promiseFor, HTTPError, normalizeError, PromiseForError } from '../src/promiseFor.js';

describe('promiseFor', () => {
  // Test successful promise resolution
  test('should resolve a promise and return [result, null]', async () => {
    const promise = Promise.resolve('test data');
    const [result, error] = await promiseFor(promise);

    expect(result).toBe('test data');
    expect(error).toBeNull();
  });

  // Test function that returns a promise
  test('should handle a function that returns a promise', async () => {
    const promiseFn = () => Promise.resolve('function result');
    const [result, error] = await promiseFor(promiseFn);

    expect(result).toBe('function result');
    expect(error).toBeNull();
  });

  // Test post-processing with modern API
  test('should apply post-processor with modern API', async () => {
    const promise = Promise.resolve(5);
    const [result, error] = await promiseFor(promise, {
      postProcessor: (num) => num * 2,
      context: 'Number doubling'
    });

    expect(result).toBe(10);
    expect(error).toBeNull();
  });

  // Test post-processing with legacy API
  test('should apply post-processor with legacy API', async () => {
    const promise = Promise.resolve(5);
    const postProcessor = (num: number) => num * 3;
    const [result, error] = await promiseFor(promise, postProcessor, 'Number tripling');

    expect(result).toBe(15);
    expect(error).toBeNull();
  });

  // Test error handling
  test('should handle rejected promises and return [null, error]', async () => {
    const promise = Promise.reject(new Error('Test error'));
    const [result, error] = await promiseFor(promise);

    expect(result).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.message).toBe('Test error');
    expect(error?.name).toBe('Error');
  });

  // Test HTTP error handling
  test('should handle HTTP errors from Response objects', async () => {
    const mockResponse = new Response(null, {
      status: 404,
      statusText: 'Not Found',
      headers: new Headers()
    });
    Object.defineProperty(mockResponse, 'ok', { value: false });
    Object.defineProperty(mockResponse, 'url', { value: 'https://example.com/api' });

    const promise = Promise.resolve(mockResponse);
    const [result, error] = await promiseFor(promise);

    expect(result).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.name).toBe('HTTPError');
    expect(error?.status).toBe(404);
    expect(error?.url).toBe('https://example.com/api');
  });

  // Test error in post-processor
  test('should handle errors in post-processor', async () => {
    const promise = Promise.resolve('test');
    const [result, error] = await promiseFor(promise, {
      postProcessor: () => { throw new Error('Post-processor error'); },
      context: 'Post-processing'
    });

    expect(result).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.message).toBe('Post-processor error');
    expect(error?.context).toBe('Post-processing');
  });

  describe('PromiseForError', () => {
    test('should convert ErrorContext to throwable PromiseForError', async () => {
      const promise = Promise.reject(new Error('Promise failure'));
      const [result, errorContext] = await promiseFor(promise);

      expect(result).toBeNull();
      expect(errorContext).not.toBeNull();

      // Convert ErrorContext to PromiseForError
      if (errorContext) {
        const promiseForError = new PromiseForError(errorContext);

        // Verify PromiseForError properties
        expect(promiseForError).toBeInstanceOf(Error);
        expect(promiseForError.name).toBe('PromiseForError');
        expect(promiseForError.message).toBe('Promise failure');
        expect(promiseForError.errorContext).toBe(errorContext);
        expect(promiseForError.statusCode).toBe(500); // Default status code

        // Demonstrate how PromiseForError can be thrown and caught
        let caughtError;
        try {
          throw promiseForError;
        } catch (err) {
          caughtError = err;
        }

        expect(caughtError).toBe(promiseForError);
      }
    });

    test('should preserve HTTP error details in PromiseForError', async () => {
      const mockResponse = new Response(null, {
        status: 404,
        statusText: 'Not Found',
        headers: new Headers()
      });
      Object.defineProperty(mockResponse, 'ok', { value: false });
      Object.defineProperty(mockResponse, 'url', { value: 'https://example.com/api' });

      const promise = Promise.resolve(mockResponse);
      const [result, errorContext] = await promiseFor(promise);

      expect(result).toBeNull();
      expect(errorContext).not.toBeNull();

      if (errorContext) {
        const promiseForError = new PromiseForError(errorContext);

        // Verify HTTP error details are preserved
        expect(promiseForError.errorContext.name).toBe('HTTPError');
        expect(promiseForError.errorContext.status).toBe(404);
        expect(promiseForError.errorContext.url).toBe('https://example.com/api');
        expect(promiseForError.statusCode).toBe(404); // Status code from HTTP error
      }
    });
  });
});
