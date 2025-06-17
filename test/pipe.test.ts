import { pipeFor } from '../src/pipe.js';
import { PipelineError } from '../src/error.js';

describe('Pipeline Functionality', () => {
  describe('pipeFor', () => {
    test('should create a pipeline with an initial promise', async () => {
      const pipeline = pipeFor(Promise.resolve(10));
      const [result, error] = await pipeline.execute();

      expect(result).toBe(10);
      expect(error).toBeNull();
    });

    test('should create a pipeline with a function that returns a promise', async () => {
      const pipeline = pipeFor(() => Promise.resolve(20));
      const [result, error] = await pipeline.execute();

      expect(result).toBe(20);
      expect(error).toBeNull();
    });

    test('should handle initial promise rejection', async () => {
      const pipeline = pipeFor(Promise.reject(new Error('Initial error')));
      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Initial error');
    });

    test('should handle error in initial function', async () => {
      const pipeline = pipeFor(() => {
        throw new Error('Function error');
      });
      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Function error');
    });
  });

  describe('transform', () => {
    test('should transform the result of a previous step', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .transform(num => num * 2);

      const [result, error] = await pipeline.execute();

      expect(result).toBe(10);
      expect(error).toBeNull();
    });

    test('should handle async transforms', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .transform(async num => {
          return new Promise(resolve => setTimeout(() => resolve(num * 3), 10));
        });

      const [result, error] = await pipeline.execute();

      expect(result).toBe(15);
      expect(error).toBeNull();
    });

    test('should propagate errors from previous steps', async () => {
      const pipeline = pipeFor(Promise.reject(new Error('Initial error')))
        .transform(num => num * 2);

      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Initial error');
    });

    test('should handle errors in transform function', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .transform(() => {
          throw new Error('Transform error');
        });

      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Transform error');
    });

    test('should include step context in error', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .transform(() => {
          throw new Error('Transform error');
        }, 'Custom transform context');

      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.context).toBe('Custom transform context');
    });
  });

  describe('pipe', () => {
    test('should pipe the result to another async operation', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .pipe(num => Promise.resolve(num * 4));

      const [result, error] = await pipeline.execute();

      expect(result).toBe(20);
      expect(error).toBeNull();
    });

    test('should handle null input by returning an error', async () => {
      // Create a pipeline that will result in null
      const nullPipeline = pipeFor(Promise.resolve(null as any))
        .pipe(num => Promise.resolve(num * 2));

      const [result, error] = await nullPipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toContain('null or undefined');
    });

    test('should propagate errors from previous steps', async () => {
      const pipeline = pipeFor(Promise.reject(new Error('Initial error')))
        .pipe(num => Promise.resolve(num * 2));

      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Initial error');
    });

    test('should handle errors in pipe function', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .pipe(() => Promise.reject(new Error('Pipe error')));

      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Pipe error');
    });

    test('should include step context in error', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .pipe(() => Promise.reject(new Error('Pipe error')), 'Custom pipe context');

      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.context).toBe('Custom pipe context');
    });
  });

  describe('Complex pipelines', () => {
    test('should chain multiple transforms and pipes', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .transform(num => num + 5)
        .pipe(num => Promise.resolve(num * 2))
        .transform(num => `Result: ${num}`);

      const [result, error] = await pipeline.execute();

      expect(result).toBe('Result: 20');
      expect(error).toBeNull();
    });

    test('should stop at the first error in the chain', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .transform(num => num + 5)
        .pipe(() => Promise.reject(new Error('Middle error')))
        .transform(num => `Result: ${num}`);

      const [result, error] = await pipeline.execute();

      expect(result).toBeNull();
      expect(error).not.toBeNull();
      expect(error?.message).toBe('Middle error');
    });
  });

  describe('PipelineError', () => {
    test('should convert ErrorContext to throwable PipelineError', async () => {
      const pipeline = pipeFor(Promise.reject(new Error('Pipeline failure')));
      const [result, errorContext] = await pipeline.execute();

      expect(result).toBeNull();
      expect(errorContext).not.toBeNull();

      // Convert ErrorContext to PipelineError
      if (errorContext) {
        const pipelineError = new PipelineError(errorContext);

        // Verify PipelineError properties
        expect(pipelineError).toBeInstanceOf(Error);
        expect(pipelineError.name).toBe('PipelineError');
        expect(pipelineError.message).toBe('Pipeline failure');
        expect(pipelineError.errorContext).toBe(errorContext);
        expect(pipelineError.statusCode).toBe(500); // Default status code

        // Demonstrate how PipelineError can be thrown and caught
        let caughtError;
        try {
          throw pipelineError;
        } catch (err) {
          caughtError = err;
        }

        expect(caughtError).toBe(pipelineError);
      }
    });

    test('should preserve step information in PipelineError', async () => {
      const pipeline = pipeFor(Promise.resolve(5))
        .transform(() => {
          throw new Error('Transform step error');
        }, 'Custom transform context');

      const [result, errorContext] = await pipeline.execute();

      expect(result).toBeNull();
      expect(errorContext).not.toBeNull();

      if (errorContext) {
        const pipelineError = new PipelineError(errorContext);

        // Verify step information is preserved
        expect(pipelineError.errorContext.stepInfo).toBeDefined();
        expect(pipelineError.errorContext.stepInfo?.type).toBe('transform');
        expect(pipelineError.errorContext.context).toBe('Custom transform context');
      }
    });
  });
});
