import { normalizeError, type HTTPError, type ErrorContext } from './error';

type PipelineStep<T, R> = {
    type: 'transform' | 'pipe';
    fn: (input: T) => R | Promise<R>;
};

type Result<T> = [T | null, ErrorContext | null];

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
        const newPromise = (async (): Promise<R> => {
            const [value, error] = await this.promise;
            if (error) {
                throw normalizeError(new Error(`Transform step ${stepIndex} failed`), error.context);
            }
            if (value === null) {
                throw normalizeError(new Error(`No value to transform`), `Transform step ${stepIndex} failed`);
            }
            const transformed = await fn(value);
            if (transformed === undefined) {
                throw normalizeError(new Error(`Transform step ${stepIndex} resulted in undefined`));
            }
            return transformed;
        })();

        const newPipeline = new Pipeline<R>(() => newPromise);
        newPipeline.steps = [...this.steps, { type: 'transform', fn }];
        return newPipeline;
    }

    pipe<R>(fn: (input: NonNullable<T>) => Promise<R>): Pipeline<R> {
        const stepIndex = this.steps.length;
        const newPromise = (async (): Promise<R> => {
            const [value, error] = await this.promise;
            if (error) {
                throw normalizeError(new Error(`Pipe step ${stepIndex} failed`), error.context);
            }
            if (value === null) {
                throw normalizeError(new Error(`No value to pipe`), `Pipe step ${stepIndex} failed`);
            }
            return await fn(value as NonNullable<T>);
        })();

        const newPipeline = new Pipeline<R>(() => newPromise);
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