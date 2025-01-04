import {ErrorContext,HTTPError,normalizeError} from "./error";
import {pipeFor} from "./pipe";

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
): Promise<[R | null,ErrorContext | null]> {

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



export { promiseFor, HTTPError,pipeFor,ErrorContext,normalizeError };
