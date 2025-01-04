/**
 * Custom error class for HTTP errors to improve consistency and reusability.
 */
export class HTTPError extends Error {
    status: number;
    url: string;

    constructor(message: string, status: number, url: string) {
        super(message);
        this.name = 'HTTPError';
        this.status = status;
        this.url = url;
    }
}

export interface ErrorContext{
    message: string;
    name: string;
    stack?: string | null;
    status?: number | null;
    url?: string | null;
    method?: string | null;
    code?: string | null;
    context: string;
}



/**
 * Utility function to normalize error details into a consistent format.
 * @param err The error object to normalize.
 * @param context A custom context for the error.
 * @returns The normalized error object with standardized properties.
 */
export function normalizeError(err: unknown, context: string = 'Error occurred'): ErrorContext{
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
