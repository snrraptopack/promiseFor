import { normalizeError } from './error.js';
import type { ErrorContext } from "./error.js";

type PipelineStep<T, R> = {
    type: 'transform' | 'pipe';
    fn: (input: T) => R | Promise<R>;
};

type Result<T> = [T | null, ErrorContext | null];

class Pipeline<T> {
    private steps: PipelineStep<any, any>[] = [];
    private initialPromise: Promise<T>;
    private promise: Promise<Result<T>>;
    private context: string;

    constructor(initial: Promise<T> | (() => Promise<T>), context: string = 'Pipeline initialization') {
        this.initialPromise = initial as Promise<T>;
        this.context = context;
        this.promise = this.wrapInitial(initial);
    }

    private async wrapInitial(initial: Promise<T> | (() => Promise<T>)): Promise<Result<T>> {
        try {
            const value = await (typeof initial === 'function' ? initial() : initial);
            return [value, null];
        } catch (err) {
            return [null, normalizeError(err, this.context)];
        }
    }

    transform<R>(fn: (input: T) => R | Promise<R>, stepContext?: string): Pipeline<R> {
        const stepIndex = this.steps.length;
        const defaultContext = `Transform step ${stepIndex}`;
        const finalContext = stepContext || defaultContext;

        const newPromise = (async (): Promise<Result<R>> => {
            const [value, error] = await this.promise;
            if (error) {
                // Propagate the original error, don't create a new one
                return [null, error];
            }
            if (value === null) {
                return [null, normalizeError(new Error(`No value to transform`), finalContext)];
            }
            
            try {
                const transformed = await fn(value);
                if (transformed === undefined) {
                    return [null, normalizeError(new Error(`${finalContext} resulted in undefined`), finalContext)];
                }
                return [transformed, null];
            } catch (err) {
                return [null, normalizeError(err, finalContext)];
            }
        })();

        const newPipeline = new Pipeline<R>(() => newPromise.then(([value]) => value as R), finalContext);
        newPipeline.promise = newPromise;
        newPipeline.steps = [...this.steps, { type: 'transform', fn }];
        return newPipeline;
    }

    pipe<R>(fn: (input: NonNullable<T>) => Promise<R>, stepContext?: string): Pipeline<R> {
        const stepIndex = this.steps.length;
        const defaultContext = `Pipe step ${stepIndex}`;
        const finalContext = stepContext || defaultContext;

        const newPromise = (async (): Promise<Result<R>> => {
            const [value, error] = await this.promise;
            if (error) {
                // Propagate the original error, don't create a new one
                return [null, error];
            }
            if (value === null) {
                return [null, normalizeError(new Error(`No value to pipe`), finalContext)];
            }
            
            try {
                const result = await fn(value as NonNullable<T>);
                return [result, null];
            } catch (err) {
                return [null, normalizeError(err, finalContext)];
            }
        })();

        const newPipeline = new Pipeline<R>(() => newPromise.then(([value]) => value as R), finalContext);
        newPipeline.promise = newPromise;
        newPipeline.steps = [...this.steps, { type: 'pipe', fn }];
        return newPipeline;
    }

    async execute(): Promise<Result<T>> {
        return this.promise;
    }
}

export function pipeFor<T>(initial: Promise<T> | (() => Promise<T>), context?: string): Pipeline<T> {
    return new Pipeline(initial, context);
}