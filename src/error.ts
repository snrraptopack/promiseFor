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

export interface ErrorContext {
    message: string;
    name: string;
    stack?: string | null;
    status?: number | null;
    url?: string | null;
    method?: string | null;
    code?: string | null;
    context: string; // Specific context of the step/error
    stepInfo?: {
        index: number; // 0-based index of the step within its pipeline segment
        type: 'initialization' | 'transform' | 'pipe';
        pipelineContext?: string; // Context of the pipeline segment that defined this step
    };
}


/**
 * Utility function to normalize error details into a consistent format.
 * @param err The error object to normalize.
 * @param context A custom context for the error.
 * @param stepDetails Optional details about the pipeline step where the error occurred.
 * @returns The normalized error object with standardized properties.
 */
export function normalizeError(
    err: unknown,
    context: string = 'Error occurred',
    stepDetails?: { index: number; type: 'initialization' | 'transform' | 'pipe'; pipelineContext?: string }
): ErrorContext {
    let normalized: ErrorContext;
    if (err instanceof Error) {
        normalized = {
            message: err.message || 'Unknown error',
            name: err.name || 'Error',
            stack: err.stack || null,
            status: (err as any).response?.status || (err as any).status || null, // HTTP status codes
            url: (err as any).response?.config?.url || (err as any).url || null, // Request URL (e.g., axios)
            method: (err as any).config?.method || null,                // HTTP method (e.g., GET, POST)
            code: (err as any).code || null,                            // Error codes, if provided
            context,
        };
    } else {
        normalized = {
            message: String(err) || 'Unknown error', // Ensure message is a string
            name: 'UnknownError', // More specific than 'Unknown'
            stack: null,
            status: null,
            url: null,
            method: null,
            code: null,
            context,
        };
    }
    if (stepDetails) {
        normalized.stepInfo = stepDetails;
    }
    return normalized;
}

export class PipelineError extends Error {
    public readonly errorContext: ErrorContext;
    public readonly statusCode: number;

    constructor(errorContext: ErrorContext) {
        super(errorContext.message); // Use the message from ErrorContext for the base Error
        this.name = 'PipelineError'; // Set the name of this custom error
        this.errorContext = errorContext;
        // Use the status from ErrorContext if available, otherwise default to 500
        this.statusCode = errorContext.status || 500;

        // Preserve the original stack if available in ErrorContext
        if (errorContext.stack) {
            this.stack = errorContext.stack;
        }

        // Maintain prototype chain
        Object.setPrototypeOf(this, PipelineError.prototype);
    }
}

/**
 * Custom error class for promiseFor errors to allow easy throwing of errors
 * returned from the promiseFor tuple.
 */
export class PromiseForError extends Error {
    public readonly errorContext: ErrorContext;
    public readonly statusCode: number;

    constructor(errorContext: ErrorContext) {
        super(errorContext.message); // Use the message from ErrorContext for the base Error
        this.name = 'PromiseForError'; // Set the name of this custom error
        this.errorContext = errorContext;
        // Use the status from ErrorContext if available, otherwise default to 500
        this.statusCode = errorContext.status || 500;

        // Preserve the original stack if available in ErrorContext
        if (errorContext.stack) {
            this.stack = errorContext.stack;
        }

        // Maintain prototype chain
        Object.setPrototypeOf(this, PromiseForError.prototype);
    }
}
