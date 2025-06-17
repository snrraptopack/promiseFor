import { HTTPError, normalizeError, type ErrorContext, PipelineError, PromiseForError } from './error.js';
import { pipeFor} from './pipe.js';

type PostProcessor<T, R> = (value: T) => R | Promise<R>;

interface PromiseForOptions<T, R> {
    postProcessor?: PostProcessor<T, R>;
    context?: string;
}

/**
 * Enhanced Promise wrapper that accepts both promise-based and function-based inputs
 * and returns a tuple [result, error]. Supports optional post-processing of the resolved value.
 *
 * This function provides two API styles:
 * 1. Legacy: promiseFor(promise, postProcessor, context)
 * 2. Modern: promiseFor(promise, { postProcessor?, context? })
 *
 * @template T The type of the original resolved value.
 * @template R The type of the processed resolved value (defaults to T if no postProcessor).
 * @param promiseOrFunction A Promise-returning function or raw Promise.
 * @param optionsOrPostProcessor Optional configuration object or legacy postProcessor function.
 * @param legacyContext Legacy context parameter (deprecated, use options.context instead).
 * @returns A tuple with the processed result and any error encountered.
 *
 * @example
 * // Modern API with options object
 * const [result, error] = await promiseFor(fetchData(), {
 *     postProcessor: data => processData(data),
 *     context: 'Data fetching and processing'
 * });
 *
 * @example
 * // Context only
 * const [result, error] = await promiseFor(fetchData(), {
 *     context: 'Loading user data'
 * });
 *
 * @example
 * // Legacy API (still supported)
 * const [result, error] = await promiseFor(fetchData(), processData, 'Custom context');
 */
async function promiseFor<T, R = T>(
    promiseOrFunction: (() => Promise<T>) | Promise<T>,
    optionsOrPostProcessor?: PromiseForOptions<T, R> | PostProcessor<T, R>,
    legacyContext?: string
): Promise<[R | null, ErrorContext | null]> {
    const result: [R | null, ErrorContext | null] = [null, null];

    // Parse parameters based on API style used
    let postProcessor: PostProcessor<T, R> | undefined;
    let context: string = "Error occurred during promise resolution";

    if (optionsOrPostProcessor) {
        if (typeof optionsOrPostProcessor === 'function') {
            // Legacy API: second param is postProcessor function
            postProcessor = optionsOrPostProcessor;
            // Use legacyContext if provided, otherwise use default
            if (legacyContext) {
                context = legacyContext;
            }
        } else {
            // Modern API: second param is options object
            postProcessor = optionsOrPostProcessor.postProcessor;
            context = optionsOrPostProcessor.context || context;
        }
    } else if (legacyContext) {
        // Handle case where optionsOrPostProcessor is undefined but legacyContext is provided
        context = legacyContext;
    }

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
        result[1] = normalizeError(err, context);
    }

    return result;
}

export { promiseFor, HTTPError, pipeFor, normalizeError, PipelineError, PromiseForError };
export type { ErrorContext, PromiseForOptions, PostProcessor };
