import { normalizeError, type HTTPError } from './error.js';

type PipelineStep<T, R> = {
    type: 'transform' | 'pipe';
    fn: (input: T) => R | Promise<R>;
};

type Result<T> = [T | null, ReturnType<typeof normalizeError> | null];

class Pipeline<T> {
    private steps: PipelineStep<any, any>[] = [];
    private initialPromise: Promise<T>;
    private promise: Promise<Result<T>>; // Ensure type inference

    constructor(initial: Promise<T> | (() => Promise<T>)) {
        this.initialPromise = initial as Promise<T>;
        this.promise = this.wrapInitial(initial);
    }

    private async wrapInitial(initial: Promise<T> | (() => Promise<T>)): Promise<Result<T>> {
        try {
            const value = await (typeof initial === 'function' ? initial() : initial);
            return [value, null];
        } catch (err) {
            return [null, normalizeError(err)];
        }
    }

    transform<R extends T | null>(fn: (input: T) => R | Promise<R>): Pipeline<R> {
        this.steps.push({ type: 'transform', fn });
        const stepIndex = this.steps.length - 1;

        this.promise = (async (): Promise<Result<R>> => {
            try {
                const [value, error] = await this.promise;

                if (error) return [null, error];
                if (value === null) {
                    return [null, normalizeError(
                        new Error('No value to transform'),
                        `Transform step ${stepIndex} failed`
                    )];
                }

                const transformed = await fn(value);
                if (transformed === undefined) {
                    throw new Error(`Transform step ${stepIndex} resulted in undefined`);
                }

                return [transformed, null];
            } catch (err) {
                return [null, normalizeError(
                    err,
                    `Transform step ${stepIndex} failed during execution`
                )];
            }
        })();

        return this as unknown as Pipeline<R>;
    }

    pipe<R>(fn: (input: NonNullable<T>) => Promise<R>): Pipeline<R> {
        this.steps.push({ type: 'pipe', fn });
        const stepIndex = this.steps.length - 1;

        const newPipeline = new Pipeline(async () => {
            const [value, error] = await this.promise;
            if (error) throw error;
            if (value === null) throw new Error(`Pipe step ${stepIndex} failed: No value to pipe`);
            if (value === undefined) throw new Error(`Pipe step ${stepIndex} failed: Value is undefined`);
            return fn(value as NonNullable<T>);
        });

        // Copy the previous steps to the new pipeline
        newPipeline.steps = [...this.steps];

        return newPipeline;
    }

    async execute(): Promise<Result<T>> {
        return await this.promise;
    }
}

export function pipeFor<T>(initial: Promise<T> | (() => Promise<T>)): Pipeline<T> {
    return new Pipeline(initial);
}