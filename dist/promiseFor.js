"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPError = void 0;
exports.promiseFor = promiseFor;
/**
 * Custom error class for HTTP errors to improve consistency and reusability.
 */
class HTTPError extends Error {
    constructor(message, status, url) {
        super(message);
        this.name = 'HTTPError';
        this.status = status;
        this.url = url;
    }
}
exports.HTTPError = HTTPError;
/**
 * Utility function to normalize error details into a consistent format.
 * @param err The error object to normalize.
 * @param context A custom context for the error.
 * @returns The normalized error object with standardized properties.
 */
function normalizeError(err, context = 'Error occurred') {
    var _a, _b, _c, _d;
    if (err instanceof Error) {
        return {
            message: err.message || 'Unknown error',
            name: err.name || 'Error',
            stack: err.stack || null,
            status: ((_a = err.response) === null || _a === void 0 ? void 0 : _a.status) || err.status || null, // HTTP status codes
            url: ((_c = (_b = err.response) === null || _b === void 0 ? void 0 : _b.config) === null || _c === void 0 ? void 0 : _c.url) || err.url || null, // Request URL (e.g., axios)
            method: ((_d = err.config) === null || _d === void 0 ? void 0 : _d.method) || null, // HTTP method (e.g., GET, POST)
            code: err.code || null, // Error codes, if provided
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
function promiseFor(promiseOrFunction, postProcessor) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = [null, null];
        try {
            // Handle the input: function or promise
            const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction;
            let resolvedValue = yield promise;
            // Special handling for HTTP responses (e.g., fetch)
            if (resolvedValue instanceof Response && !resolvedValue.ok) {
                throw new HTTPError(`HTTP error! status: ${resolvedValue.status}`, resolvedValue.status, resolvedValue.url);
            }
            // Apply the post-processor, if provided
            if (postProcessor) {
                const isAsync = postProcessor.constructor.name === 'AsyncFunction';
                try {
                    // @ts-ignore
                    resolvedValue = isAsync
                        ? yield postProcessor(resolvedValue)
                        : postProcessor(resolvedValue);
                }
                catch (postProcessorError) {
                    result[1] = normalizeError(postProcessorError, 'Error occurred during post-processing');
                    return result; // Return early with error if post-processing fails
                }
            }
            result[0] = resolvedValue; // Success case
        }
        catch (err) {
            result[1] = normalizeError(err, 'Error occurred during promise resolution');
        }
        return result; // Returns [data, error]
    });
}
