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
function promiseFor(promiseOrFunction, postProcessor) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = [null, null];
        try {
            // Handle the input: function or promise
            const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction;
            const resolvedValue = yield promise;
            // Special handling for HTTP responses (e.g., fetch)
            if (resolvedValue instanceof Response && !resolvedValue.ok) {
                throw new error_1.HTTPError(`HTTP error! status: ${resolvedValue.status}`, resolvedValue.status, resolvedValue.url);
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
            result[1] = (0, error_1.normalizeError)(err, 'Error occurred during promise resolution');
        }
        return result;
    });
}
