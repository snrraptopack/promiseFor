import { pipeFor, ErrorContext, promiseFor } from '../src/promiseFor';

describe('Pipeline in TypeScript', () => {
    it('should transform and pipe correctly', async () => {
        const initial = Promise.resolve({ id: 1, name: 'Test' });
        const [result, error] = await pipeFor(initial)
            .transform((data) => data.id)
            .pipe((id) => Promise.resolve(`Post for user ${id}`))
            .execute();

        expect(error).toBeNull();
        expect(result).toBe('Post for user 1');
    });

    it('should handle errors', async () => {
        const initial = Promise.reject(new Error('Fetch failed'));
        const [result, error] = await pipeFor(initial).execute();

        expect(result).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.context).toBe('Pipeline initialization');
        expect(error?.message).toBe('Fetch failed');
    });

    it('should include custom pipeline context in initialization errors', async () => {
        const customContext = "User data fetching pipeline";
        const failingPromise = Promise.reject(new Error('API unavailable'));

        const [result, error] = await pipeFor(failingPromise, customContext).execute();

        expect(result).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.context).toBe(customContext);
        expect(error?.message).toBe('API unavailable');
    });

    it('should include step context in transform errors', async () => {
        const initial = Promise.resolve({ id: 1, name: 'Test' });
        const customStepContext = "Data validation step";
        
        const [result, error] = await pipeFor(initial, "Main pipeline")
            .transform(() => {
                throw new Error('Validation failed');
            }, customStepContext)
            .execute();

        expect(result).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.context).toBe(customStepContext);
        expect(error?.message).toBe('Validation failed');
    });

    it('should include step context in pipe errors', async () => {
        const initial = Promise.resolve(123);
        const customStepContext = "Database save operation";
        
        const [result, error] = await pipeFor(initial)
            .pipe(async () => {
                throw new Error('Database connection failed');
            }, customStepContext)
            .execute();

        expect(result).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.context).toBe(customStepContext);
        expect(error?.message).toBe('Database connection failed');
    });

    it('should use default context when no custom context is provided', async () => {
        const initial = Promise.resolve(10);
        
        const [result, error] = await pipeFor(initial)
            .transform(() => {
                throw new Error('Transform error');
            })
            .execute();

        expect(result).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.context).toBe('Transform step 0');
        expect(error?.message).toBe('Transform error');
    });

    it('should handle multiple steps with different contexts', async () => {
        const initial = Promise.resolve({ data: 'test' });
        
        const [result, error] = await pipeFor(initial, "Multi-step pipeline")
            .transform(data => data.data, "Extract data step")
            .transform(str => str.toUpperCase(), "Uppercase transformation")
            .pipe(async (str) => {
                throw new Error('Final step failed');
            }, "Final processing step")
            .execute();

        expect(result).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.context).toBe('Final processing step');
        expect(error?.message).toBe('Final step failed');
    });

    it('should propagate previous error context correctly', async () => {
        const initial = Promise.reject(new Error('Initial error'));
        
        const [result, error] = await pipeFor(initial, "Base pipeline")
            .transform(data => data, "Should not execute")
            .execute();

        expect(result).toBeNull();
        expect(error).not.toBeNull();
        expect(error?.context).toBe('Base pipeline');
        expect(error?.message).toBe('Initial error');
    });
});

it('should include the provided context in the error', async () => {
    const customContext = "Custom context for test";
    const failingPromise = Promise.reject(new Error('Something went wrong'));

    const [result, error] = await promiseFor(failingPromise, undefined, customContext);

    expect(result).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.context).toBe(customContext);
    expect(error?.message).toBe('Something went wrong');
});

it('should include the provided context in the error using options object', async () => {
    const customContext = "Custom context for test";
    const failingPromise = Promise.reject(new Error('Something went wrong'));

    const [result, error] = await promiseFor(failingPromise, {
        context: customContext
    });

    expect(result).toBeNull();
    expect(error).not.toBeNull();
    expect(error?.context).toBe(customContext);
    expect(error?.message).toBe('Something went wrong');
});

it('should work with both postProcessor and context', async () => {
    const [result, error] = await promiseFor(
        Promise.resolve({ value: 42 }),
        {
            postProcessor: (data) => data.value * 2,
            context: 'Data transformation'
        }
    );

    expect(error).toBeNull();
    expect(result).toBe(84);
});

it('should maintain backward compatibility with function as second parameter', async () => {
    const [result, error] = await promiseFor(
        Promise.resolve(10),
        (value) => value * 3
    );

    expect(error).toBeNull();
    expect(result).toBe(30);
});