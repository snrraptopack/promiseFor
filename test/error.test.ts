import { HTTPError, normalizeError, PipelineError, type ErrorContext } from '../src/error.js';

describe('Error Handling Utilities', () => {
  describe('HTTPError', () => {
    test('should create an HTTPError with correct properties', () => {
      const error = new HTTPError('Not Found', 404, 'https://example.com/api');

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('HTTPError');
      expect(error.message).toBe('Not Found');
      expect(error.status).toBe(404);
      expect(error.url).toBe('https://example.com/api');
    });
  });

  describe('normalizeError', () => {
    test('should normalize an Error instance', () => {
      const originalError = new Error('Test error');
      const context = 'Error context';
      const normalized = normalizeError(originalError, context);

      expect(normalized.message).toBe('Test error');
      expect(normalized.name).toBe('Error');
      expect(normalized.stack).toBeDefined();
      expect(normalized.context).toBe(context);
    });

    test('should normalize an HTTPError instance', () => {
      const originalError = new HTTPError('Not Found', 404, 'https://example.com/api');
      const context = 'HTTP error context';
      const normalized = normalizeError(originalError, context);

      expect(normalized.message).toBe('Not Found');
      expect(normalized.name).toBe('HTTPError');
      expect(normalized.status).toBe(404);
      expect(normalized.url).toBe('https://example.com/api');
      expect(normalized.context).toBe(context);
    });

    test('should normalize a non-Error value', () => {
      const normalized = normalizeError('string error', 'String error context');

      expect(normalized.message).toBe('string error');
      expect(normalized.name).toBe('UnknownError');
      expect(normalized.context).toBe('String error context');
    });

    test('should include step details when provided', () => {
      const error = new Error('Pipeline step error');
      const stepDetails = {
        index: 2,
        type: 'transform' as const,
        pipelineContext: 'Data transformation pipeline'
      };

      const normalized = normalizeError(error, 'Step error context', stepDetails);

      expect(normalized.stepInfo).toBeDefined();
      expect(normalized.stepInfo?.index).toBe(2);
      expect(normalized.stepInfo?.type).toBe('transform');
      expect(normalized.stepInfo?.pipelineContext).toBe('Data transformation pipeline');
    });
  });

  describe('PipelineError', () => {
    test('should create a PipelineError with correct properties', () => {
      const errorContext: ErrorContext = {
        message: 'Pipeline failed',
        name: 'TestError',
        stack: 'stack trace',
        status: 500,
        context: 'Pipeline context'
      };

      const error = new PipelineError(errorContext);

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('PipelineError');
      expect(error.message).toBe('Pipeline failed');
      expect(error.stack).toBe('stack trace');
      expect(error.statusCode).toBe(500);
      expect(error.errorContext).toBe(errorContext);
    });

    test('should default statusCode to 500 when status is not provided', () => {
      const errorContext: ErrorContext = {
        message: 'Pipeline failed',
        name: 'TestError',
        context: 'Pipeline context'
      };

      const error = new PipelineError(errorContext);

      expect(error.statusCode).toBe(500);
    });
  });
});
