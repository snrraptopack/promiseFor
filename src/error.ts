/**
 * Custom error class for HTTP errors to improve consistency and reusability.
 */
export class HTTPError extends Error {
    status: number;
    url: string;
    responseData?: any; // Add this to store the full response data

    constructor(message: string, status: number, url: string, responseData?: any) {
        super(message);
        this.name = 'HTTPError';
        this.status = status;
        this.url = url;
        this.responseData = responseData; // Store the complete response data
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
    responseData?: any; // Add this field to store full response data
    stepInfo?: {
        index: number; // 0-based index of the step within its pipeline segment
        type: 'initialization' | 'transform' | 'pipe';
        pipelineContext?: string; // Context of the pipeline segment that defined this step
    };
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
            status: (err as any).response?.status || (err as any).status || null,
            url: (err as any).response?.config?.url || (err as any).url || null,
            method: (err as any).config?.method || null,
            code: (err as any).code || null,
            responseData: (err as any).responseData || null, // Add this line
            context,
        };
    } else {
        normalized = {
            message: String(err) || 'Unknown error',
            name: 'UnknownError',
            stack: null,
            status: null,
            url: null,
            method: null,
            code: null,
            responseData: null, // Add this line
            context,
        };
    }
    if (stepDetails) {
        normalized.stepInfo = stepDetails;
    }
    return normalized;
}
