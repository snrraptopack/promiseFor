import { ErrorContext, HTTPError, normalizeError } from './error';
import { pipeFor } from './pipe';

type PostProcessor<T, R> = (value: T) => R | Promise<R>;

/**
 * Enhanced Promise wrapper that accepts both promise-based and function-based inputs
 * and returns a tuple [result, error]. Supports optional post-processing of the resolved value.
 *
 * @template T The type of the original resolved value.
 * @template R The type of the processed resolved value (defaults to T if no postProcessor).
 * @param promiseOrFunction A Promise-returning function or raw Promise.
 * @param postProcessor Optional function to transform or process the resolved value.
 * @returns A tuple with the processed result and any error encountered.
 */
async function promiseFor<T, R = T>(
    promiseOrFunction: (() => Promise<T>) | Promise<T>,
    postProcessor?: PostProcessor<T, R>
): Promise<[R | null, ErrorContext | null]> {
    const result: [R | null, ErrorContext | null] = [null, null];

    try {
        // Handle the input: function or promise
        const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction;
        const resolvedValue = await promise;

        // Special handling for HTTP responses (e.g., fetch)
        if (resolvedValue instanceof Response && !resolvedValue.ok) {
            throw new HTTPError(
                `HTTP error! status: ${resolvedValue.status}`,
                resolvedValue.status,
                resolvedValue.url
            );
        }

        // Apply the post-processor, if provided
        if (postProcessor) {
            result[0] = await postProcessor(resolvedValue); // Handles both R and Promise<R>
        } else {
            result[0] = resolvedValue as R; // R = T when postProcessor is undefined
        }
    } catch (err: unknown) {
        result[1] = normalizeError(err, 'Error occurred during promise resolution');
    }

    return result;
}

export { promiseFor, HTTPError, pipeFor, ErrorContext, normalizeError };