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
exports.normalizeError = exports.pipeFor = exports.HTTPError = void 0;
exports.promiseFor = promiseFor;
const error_1 = require("./error");
Object.defineProperty(exports, "HTTPError", { enumerable: true, get: function () { return error_1.HTTPError; } });
Object.defineProperty(exports, "normalizeError", { enumerable: true, get: function () { return error_1.normalizeError; } });
const pipe_1 = require("./pipe");
Object.defineProperty(exports, "pipeFor", { enumerable: true, get: function () { return pipe_1.pipeFor; } });
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
                throw new error_1.HTTPError(`HTTP error! status: ${resolvedValue.status}`, resolvedValue.status, resolvedValue.url);
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
                    result[1] = (0, error_1.normalizeError)(postProcessorError, 'Error occurred during post-processing');
                    return result; // Return early with error if post-processing fails
                }
            }
            result[0] = resolvedValue; // Success case
        }
        catch (err) {
            result[1] = (0, error_1.normalizeError)(err, 'Error occurred during promise resolution');
        }
        return result; // Returns [data, error]
    });
}
