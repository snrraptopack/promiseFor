/**
 * Custom error class for HTTP errors to improve consistency and reusability.
 */
class HTTPError extends Error {
    status: number;
    url: string;

    constructor(message: string, status: number, url: string) {
        super(message);
        this.name = 'HTTPError';
        this.status = status;
        this.url = url;
    }
}

/**
 * Utility function to normalize error details into a consistent format.
 * @param err The error object to normalize.
 * @param context A custom context for the error.
 * @returns The normalized error object with standardized properties.
 */
function normalizeError(
    err: unknown,
    context: string = 'Error occurred'
): {
    message: string;
    name: string;
    stack?: string | null;
    status?: number | null;
    url?: string | null;
    method?: string | null;
    code?: string | null;
    context: string;
} {
    if (err instanceof Error) {
        return {
            message: err.message || 'Unknown error',
            name: err.name || 'Error',
            stack: err.stack || null,
            status: (err as any).response?.status || (err as any).status || null, // HTTP status codes
            url: (err as any).response?.config?.url || (err as any).url || null, // Request URL (e.g., axios)
            method: (err as any).config?.method || null,                // HTTP method (e.g., GET, POST)
            code: (err as any).code || null,                            // Error codes, if provided
            context,
    };
    }
    return {
        message: 'Unknown error',
        name: 'Unknown',
        stack: null,
        status: null,
        url: null,
        method: null,
        code: null,
        context,
    };
}

type PostProcessor<T, R> = (value: T) => R | Promise<R>;

// @ts-ignore
/**
 * Enhanced Promise wrapper that accepts both callback-based and promise-based functions
 * and returns a tuple [result, error]. It also supports optional post-processing of the resolved value.
 *
 * @template T The type of the original resolved value.
 * @template R The type of the processed resolved value (if postProcessor is used).
 * @param promiseOrFunction - A Promise-returning function, raw Promise, or callback-based function.
 * @param postProcessor - Optional function to transform or process the resolved value.
 * @returns A tuple with the processed result and any error encountered.
 */


async function promiseFor<T, R>(
    promiseOrFunction: (() => Promise<T>) | Promise<T>,
    postProcessor?: PostProcessor<T, R>
): Promise<[
    R | null,
    {
        message: string;
        name: string;
        stack?: string | null;
        status?: number | null;
        url?: string | null;
        method?: string | null;
        code?: string | null;
        context?: string;
    } | null
]> {
    const result: [R | null, ReturnType<typeof normalizeError> | null] = [null, null];

try {
    // Handle the input: function or promise
    const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction;
    let resolvedValue = await promise;

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
        const isAsync = postProcessor.constructor.name === 'AsyncFunction';
        try {
            // @ts-ignore
            resolvedValue = isAsync
                ? await postProcessor(resolvedValue)
                : postProcessor(resolvedValue);
        } catch (postProcessorError) {
            result[1] = normalizeError(postProcessorError, 'Error occurred during post-processing');
            return result; // Return early with error if post-processing fails
        }
    }

    result[0] = resolvedValue as R; // Success case
} catch (err: unknown) {
    result[1] = normalizeError(err, 'Error occurred during promise resolution');
}

return result; // Returns [data, error]
}



export { promiseFor, HTTPError };
