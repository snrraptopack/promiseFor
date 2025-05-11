import { normalizeError, type HTTPError } from './error.js';

type PipelineStep<T, R> = {
    type: 'transform' | 'pipe';
    fn: (input: T) => R | Promise<R>;
};

type Result<T> = [T | null, ReturnType<typeof normalizeError> | null];

class Pipeline<T> {
    private steps: PipelineStep<any, any>[] = [];
    private initialPromise: Promise<T>;
    private promise: Promise<Result<T>>;

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

    transform<R>(fn: (input: T) => R | Promise<R>): Pipeline<R> {
        const stepIndex = this.steps.length;
        const newPromise = (async (): Promise<Result<R>> => {
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

        // @ts-ignore
        const newPipeline = new Pipeline<R>(newPromise);
        newPipeline.steps = [...this.steps, { type: 'transform', fn }];
        return newPipeline;
    }

    pipe<R>(fn: (input: NonNullable<T>) => Promise<R>): Pipeline<R> {
        const stepIndex = this.steps.length;
        const newPromise = (async (): Promise<Result<R>> => {
            try {
                const [value, error] = await this.promise;
                if (error) return [null, error];
                if (value === null) {
                    return [null, normalizeError(
                        new Error('No value to pipe'),
                        `Pipe step ${stepIndex} failed`
                    )];
                }
                const result = await fn(value as NonNullable<T>);
                return [result, null];
            } catch (err) {
                return [null, normalizeError(
                    err,
                    `Pipe step ${stepIndex} failed during execution`
                )];
            }
        })();

        // @ts-ignore
        const newPipeline = new Pipeline<R>(newPromise);
        newPipeline.steps = [...this.steps, { type: 'pipe', fn }];
        return newPipeline;
    }

    async execute(): Promise<Result<T>> {
        return this.promise;
    }
}

export function pipeFor<T>(initial: Promise<T> | (() => Promise<T>)): Pipeline<T> {
    return new Pipeline(initial);
}