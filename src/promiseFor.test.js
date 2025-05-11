const { pipeFor } = require('../dist/promiseFor');

describe('Pipeline in JavaScript', () => {
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
    expect(error).toEqual(error);
  });
});