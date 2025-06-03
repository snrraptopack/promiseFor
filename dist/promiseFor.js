var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HTTPError, normalizeError } from './error';
import { pipeFor } from './pipe';
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
function promiseFor(promiseOrFunction, optionsOrPostProcessor, legacyContext) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = [null, null];
        // Parse parameters based on API style used
        let postProcessor;
        let context = "Error occurred during promise resolution";
        if (optionsOrPostProcessor) {
            if (typeof optionsOrPostProcessor === 'function') {
                // Legacy API: second param is postProcessor function
                postProcessor = optionsOrPostProcessor;
                // Use legacyContext if provided, otherwise use default
                if (legacyContext) {
                    context = legacyContext;
                }
            }
            else {
                // Modern API: second param is options object
                postProcessor = optionsOrPostProcessor.postProcessor;
                context = optionsOrPostProcessor.context || context;
            }
        }
        else if (legacyContext) {
            // Handle case where optionsOrPostProcessor is undefined but legacyContext is provided
            context = legacyContext;
        }
        try {
            // Handle the input: function or promise
            const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction;
            const resolvedValue = yield promise;
            // Special handling for HTTP responses (e.g., fetch)
            if (resolvedValue instanceof Response && !resolvedValue.ok) {
                throw new HTTPError(`HTTP error! status: ${resolvedValue.status}`, resolvedValue.status, resolvedValue.url);
            }
            // Apply the post-processor, if provided
            if (postProcessor) {
                result[0] = yield postProcessor(resolvedValue); // Handles both R and Promise<R>
            }
            else {
                result[0] = resolvedValue; // R = T when postProcessor is undefined
            }
        }
        catch (err) {
            result[1] = normalizeError(err, context);
        }
        return result;
    });
}
export { promiseFor, HTTPError, pipeFor, normalizeError };
