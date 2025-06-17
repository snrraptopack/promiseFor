import { normalizeError, type ErrorContext } from './error.js';

type PipelineStep<T, R> = {
    type: 'transform' | 'pipe';
    fn: (input: T) => R | Promise<R>; // This is a general signature, specific methods will narrow it
};

// Result<T> is [value | null, errorContext | null]
type Result<T> = [T | null, ErrorContext | null];

class Pipeline<T> {
    private steps: PipelineStep<any, any>[] = [];

    private initialPromiseSource: Promise<T> | (() => Promise<T>);
    private promise: Promise<Result<T>>;
    private context: string; // Context of the current pipeline segment

    constructor(initial: Promise<T> | (() => Promise<T>), context: string = 'Pipeline initialization') {
        this.initialPromiseSource = initial;
        this.context = context; // Context for the initial operation or this pipeline segment
        this.promise = this.wrapInitial(initial);
        this.steps = []; // Initialize steps array
    }

    private async wrapInitial(initial: Promise<T> | (() => Promise<T>)): Promise<Result<T>> {
        const initialOperationContext = this.context; // Use the pipeline's context for its initialization
        try {
            const value = await (typeof initial === 'function' ? initial() : initial);
            if (value === undefined) { // Optional: Treat undefined initial value as an error
                return [null, normalizeError(
                    new Error('Initial value resolved to undefined.'),
                    initialOperationContext,
                    // -1 or a special marker for the initial operation within this pipeline segment
                    { index: -1, type: 'initialization', pipelineContext: initialOperationContext }
                )];
            }
            return [value, null];
        } catch (err) {
            return [null, normalizeError(
                err,
                initialOperationContext,
                { index: -1, type: 'initialization', pipelineContext: initialOperationContext }
            )];
        }
    }

    transform<R>(fn: (input: T) => R | Promise<R>, stepContext?: string): Pipeline<R> {
        const stepIndex = this.steps.length; // 0-based index for this new step in the current segment
        const defaultStepContext = `Transform step ${stepIndex}`;
        // finalStepContext is the specific context for this step's potential error
        const finalStepContext = stepContext || defaultStepContext;
        // currentPipelineSegmentContext is the context of the pipeline segment defining this step
        const currentPipelineSegmentContext = this.context;

        const newPromise = (async (): Promise<Result<R>> => {
            const [value, error] = await this.promise;
            if (error) {
                return [null, error]; // Propagate existing error (it already has its stepInfo)
            }
            // If T can be null and fn doesn't expect it, this check is important.
            // If fn is designed to handle T | null, this specific check might be redundant with fn's logic.
            if (value === null) {
                return [null, normalizeError(
                    new Error(`Transformation input was null.`),
                    finalStepContext,
                    { index: stepIndex, type: 'transform', pipelineContext: currentPipelineSegmentContext }
                )];
            }

            try {
                // The type of 'value' here is T. If fn expects NonNullable<T>, a cast or further check might be needed
                // if T itself can be null. However, the 'value === null' check above handles one case.
                const transformed = await fn(value as T);
                if (transformed === undefined) { // If 'undefined' is an explicit error state for transforms
                    return [null, normalizeError(
                        new Error(`Transformation resulted in undefined`),
                        finalStepContext,
                        { index: stepIndex, type: 'transform', pipelineContext: currentPipelineSegmentContext }
                    )];
                }
                return [transformed, null];
            } catch (err) {
                return [null, normalizeError(
                    err,
                    finalStepContext,
                    { index: stepIndex, type: 'transform', pipelineContext: currentPipelineSegmentContext }
                )];
            }
        })();

        // The context for the new Pipeline instance. Using finalStepContext means the "pipeline segment"
        // context for the *next* step (if chained from this newPipeline) would be the context of *this current* step.
        // This creates a nested context structure if desired.
        const newPipeline = new Pipeline<R>(() => newPromise.then(([val]) => val as R), finalStepContext);
        newPipeline.promise = newPromise; // Crucially override the new pipeline's promise
        // Propagate steps for introspection, or manage them differently if segments are fully independent
        newPipeline.steps = [...this.steps, { type: 'transform', fn: fn as any }];
        return newPipeline;
    }

    pipe<R>(fn: (input: NonNullable<T>) => Promise<R>, stepContext?: string): Pipeline<R> {
        const stepIndex = this.steps.length;
        const defaultStepContext = `Pipe step ${stepIndex}`;
        const finalStepContext = stepContext || defaultStepContext;
        const currentPipelineSegmentContext = this.context;

        const newPromise = (async (): Promise<Result<R>> => {
            const [value, error] = await this.promise;
            if (error) {
                return [null, error];
            }
            // fn expects NonNullable<T>. This check ensures that contract.
            if (value === null || value === undefined) {
                return [null, normalizeError(
                    new Error(`Pipe input was null or undefined, but NonNullable input was expected.`),
                    finalStepContext,
                    { index: stepIndex, type: 'pipe', pipelineContext: currentPipelineSegmentContext }
                )];
            }

            try {
                const result = await fn(value as NonNullable<T>);
                // Generally, a promise resolving to 'undefined' is a valid outcome.
                // Add an error condition here only if 'undefined' is explicitly an error for your pipe operations.
                // e.g., if (result === undefined && someCondition) { ... }
                return [result, null];
            } catch (err) {
                return [null, normalizeError(
                    err,
                    finalStepContext,
                    { index: stepIndex, type: 'pipe', pipelineContext: currentPipelineSegmentContext }
                )];
            }
        })();

        const newPipeline = new Pipeline<R>(() => newPromise.then(([val]) => val as R), finalStepContext);
        newPipeline.promise = newPromise;
        newPipeline.steps = [...this.steps, { type: 'pipe', fn: fn as any }];
        return newPipeline;
    }

    async execute(): Promise<Result<T>> {
        return this.promise;
    }
}

export function pipeFor<T>(initial: Promise<T> | (() => Promise<T>), context?: string): Pipeline<T> {
    return new Pipeline(initial, context);
}
