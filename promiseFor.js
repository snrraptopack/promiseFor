
/**
 * Enhanced Promise wrapper that accepts both callback-based and promise-based functions
 * and returns a tuple [result, error].
 *
 * @template T
 * @template E
 * @param {(callback: (error: E | null, result?: T) => void) => void | Promise<T>} promiseOrFunction - A function that returns a promise, or a callback-based function.
 * @returns {Promise<[T | null, E | null]>} - A tuple with the resolved data and any error encountered.
 */
async function promiseFor(promiseOrFunction) {
    const result = [null, null];

    try {
        const promise = typeof promiseOrFunction === 'function' ? promiseOrFunction() : promiseOrFunction;
        result[0] = await promise;  // Await the resolved value
    } catch (err) {
        result[1] = err;  // Capture the error
    }

    return result;  // Return a tuple [result, error]
}

module.exports = {promiseFor}