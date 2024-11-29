/**
 * Utility function to normalize error details into a consistent format.
 * @param {Error} err The error object to normalize.
 * @param {string} [context="Error occurred"] A custom context for the error.
 * @returns {Object} The normalized error object with standardized properties.
 */
function normalizeError(err, context = 'Error occurred') {
    return {
        message: err.message || 'Unknown error',
        name: err.name || 'Error',
        stack: err.stack || null,
        status: err.response?.status || err.status || null, // HTTP status codes
        url: err.response?.config?.url || err.url || null,  // Request URL (e.g., axios)
        method: err.config?.method || null,                 // HTTP method (e.g., GET, POST)
        code: err.code || null,                             // Error codes, if provided
        context,
    };
}

/**
 * Enhanced Promise wrapper that accepts both callback-based and promise-based functions
 * and returns a tuple [result, error]. It also supports optional post-processing of the resolved value.
 *
 * @template T The type of the original resolved value
 * @template {Function} [P=null] Optional post-processor function type
 * @param {(() => Promise<T>) | Promise<T> | ((callback: (error: *, result?: T) => void) => void)} promiseOrFunction
 *   - A Promise-returning function.
 *   - A raw Promise.
 *   - A callback-based function.
 *
 * @param {P} [postProcessor] - Optional function to transform or process the resolved value (e.g., JSON.parse).
 *
 * @returns {Promise<[
 *   (P extends Function ? ReturnType<P> : T) | null,
 *   {
 *     message: string,
 *     name: string,
 *     stack?: string,
 *     status?: number,
 *     url?: string,
 *     method?: string,
 *     code?: string,
 *     context?: string
 *   } | null
 * ]>}
 * - A tuple with the processed result and any error encountered.
 */
async function promiseFor(promiseOrFunction, postProcessor) {
    const result = [null, null];

    try {
        // Handle the input: function, promise, or callback
        const promise = typeof promiseOrFunction === "function" ? promiseOrFunction() : promiseOrFunction;
        let resolvedValue = await promise;

        // Special handling for HTTP responses (e.g., fetch)
        if (resolvedValue instanceof Response && !resolvedValue.ok) {
            throw {
                name: "HTTPError",
                message: `HTTP error! status: ${resolvedValue.status}`,
                status: resolvedValue.status,
                url: resolvedValue.url,
            };
        }

        // Apply the post-processor, if provided
        if (postProcessor) {
            const isAsync = postProcessor.constructor.name === "AsyncFunction";
            try {
                resolvedValue = isAsync ? await postProcessor(resolvedValue) : postProcessor(resolvedValue);
            } catch (postProcessorError) {
                result[1] = normalizeError(postProcessorError, 'Error occurred during post-processing');
                return result;  // Return early with error if post-processing fails
            }
        }

        result[0] = resolvedValue; // Success case
    } catch (err) {
        result[1] = normalizeError(err, 'Error occurred in promiseFor');
    }

    return result; // Returns [data, error]
}

module.exports = { promiseFor };
