import {pipe, pipeSync} from '../index';
import type {Middleware} from '../index';

const passThroughMiddleware: Middleware<(...args: any) => any> = (...args) =>
  args[args.length - 1]();

describe('pipe tests', () => {
  it('should call a given handler', async () => {
    const handler = vi.fn();
    const pipeline = pipe(handler);

    await pipeline();

    expect(handler).toHaveBeenCalledOnce();
  });

  it('should call a given handler with the pipeline arguments', async () => {
    const handler = vi.fn();
    const pipeline = pipe(handler);

    await pipeline('a', 1, null, false);

    expect(handler).toHaveBeenCalledWith('a', 1, null, false);
  });

  it('should return the response from the last handler', async () => {
    const handler = vi.fn((value: string) => `hello ${value}`);
    const pipeline = pipe(handler);

    const result = await pipeline('world');

    expect(result).toBe('hello world');
  });

  it('should throw an error from the handler', async () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn(async () => {
      throw error;
    });
    const pipeline = pipe(handler);

    try {
      await pipeline();
      expect(false).toBe('Never should be reached');
    } catch (e: any) {
      expect(e.message).toBe(error.message);
    }
  });

  it('should call a middleware', async () => {
    const handler = vi.fn();
    const middleware = vi.fn(passThroughMiddleware);
    const pipeline = pipe(middleware, handler);

    await pipeline();

    expect(middleware).toHaveBeenCalledOnce();
  });

  it('should call the handler when a middleware is present', async () => {
    const handler = vi.fn();
    const middleware = vi.fn(passThroughMiddleware);
    const pipeline = pipe(middleware, handler);

    await pipeline();

    expect(handler).toHaveBeenCalledOnce();
  });

  it('should call a middleware with the given parameters and a function', async () => {
    const handler = vi.fn();
    const middleware = vi.fn(passThroughMiddleware);
    const pipeline = pipe(middleware, handler);

    await pipeline('a', 1, null, false);

    expect(middleware).toHaveBeenCalledWith(
      'a',
      1,
      null,
      false,
      expect.any(Function),
    );
  });

  it('should call a handler with the given parameters when a middleware is defined', async () => {
    const handler = vi.fn();
    const middleware = vi.fn(passThroughMiddleware);
    const pipeline = pipe(middleware, handler);

    await pipeline('a', 1, null, false);

    expect(handler).toHaveBeenCalledWith('a', 1, null, false);
  });

  it('should change the input passed into the handler', async () => {
    const handler = vi.fn((value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn((value, next) =>
      next(null, `, ${value}`),
    );
    const pipeline = pipe(middleware, handler);

    const result = await pipeline('world');

    expect(result).toBe('hello , world');
  });

  it('should change the response returned from the handler', async () => {
    const handler = vi.fn(async (value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn(async (value, next) =>
      (await next(null, `, ${value}`)).replace(' ,', ','),
    );
    const pipeline = pipe(middleware, handler);

    const result = await pipeline('world');

    expect(result).toBe('hello, world');
  });

  it("should throw if an error is passed to the middleware's next function", async () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn(async (value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn(async (_, next) =>
      next(error),
    );
    const pipeline = pipe(middleware, handler);

    try {
      await pipeline('hello');
      expect(false).toBe('Never should be reached');
    } catch (e: any) {
      expect(e.message).toBe(error.message);
    }
  });

  it("should not call the handler if an error is passed to the middleware's next function", async () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn(async (value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn(async (_, next) =>
      next(error),
    );
    const pipeline = pipe(middleware, handler);

    try {
      await pipeline('hello');
      expect(false).toBe('Never should be reached');
    } catch (_) {
      expect(handler).not.toHaveBeenCalled();
    }
  });

  it('should throw if an error is thrown in a middleware', async () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn(async (value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn(async (_) => {
      throw error;
    });
    const pipeline = pipe(middleware, handler);

    try {
      await pipeline('hello');
      expect(false).toBe('Never should be reached');
    } catch (e: any) {
      expect(e.message).toBe(error.message);
    }
  });

  it('should not call the handler if an error is thrown in a middleware', async () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn(async (value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn(async (_) => {
      throw error;
    });
    const pipeline = pipe(middleware, handler);

    try {
      await pipeline('hello');
      expect(false).toBe('Never should be reached');
    } catch (_) {
      expect(handler).not.toHaveBeenCalled();
    }
  });
});

describe('pipeSync tests', () => {
  it('should call a given handler', () => {
    const handler = vi.fn();
    const pipeline = pipeSync(handler);

    pipeline();

    expect(handler).toHaveBeenCalledOnce();
  });

  it('should call a given handler with the pipeline arguments', () => {
    const handler = vi.fn();
    const pipeline = pipeSync(handler);

    pipeline('a', 1, null, false);

    expect(handler).toHaveBeenCalledWith('a', 1, null, false);
  });

  it('should return the response from the last handler', () => {
    const handler = vi.fn((value: string) => `hello ${value}`);
    const pipeline = pipeSync(handler);

    const result = pipeline('world');

    expect(result).toBe('hello world');
  });

  it('should throw an error from the handler', () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn(() => {
      throw error;
    });
    const pipeline = pipeSync(handler);

    try {
      pipeline();
      expect(false).toBe('Never should be reached');
    } catch (e: any) {
      expect(e.message).toBe(error.message);
    }
  });

  it('should call a middleware', () => {
    const handler = vi.fn();
    const middleware = vi.fn(passThroughMiddleware);
    const pipeline = pipeSync(middleware, handler);

    pipeline();

    expect(middleware).toHaveBeenCalledOnce();
  });

  it('should call the handler when a middleware is present', () => {
    const handler = vi.fn();
    const middleware = vi.fn(passThroughMiddleware);
    const pipeline = pipeSync(middleware, handler);

    pipeline();

    expect(handler).toHaveBeenCalledOnce();
  });

  it('should call a middleware with the given parameters and a function', () => {
    const handler = vi.fn();
    const middleware = vi.fn(passThroughMiddleware);
    const pipeline = pipeSync(middleware, handler);

    pipeline('a', 1, null, false);

    expect(middleware).toHaveBeenCalledWith(
      'a',
      1,
      null,
      false,
      expect.any(Function),
    );
  });

  it('should call a handler with the given parameters when a middleware is defined', () => {
    const handler = vi.fn();
    const middleware = vi.fn(passThroughMiddleware);
    const pipeline = pipeSync(middleware, handler);

    pipeline('a', 1, null, false);

    expect(handler).toHaveBeenCalledWith('a', 1, null, false);
  });

  it('should change the input passed into the handler', () => {
    const handler = vi.fn((value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn((value, next) =>
      next(null, `, ${value}`),
    );
    const pipeline = pipeSync(middleware, handler);

    const result = pipeline('world');

    expect(result).toBe('hello , world');
  });

  it('should change the response returned from the handler', () => {
    const handler = vi.fn((value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn((value, next) =>
      next(null, `, ${value}`).replace(' ,', ','),
    );
    const pipeline = pipeSync(middleware, handler);

    const result = pipeline('world');

    expect(result).toBe('hello, world');
  });

  it("should throw if an error is passed to the middleware's next function", () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn((value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn((_, next) =>
      next(error),
    );
    const pipeline = pipeSync(middleware, handler);

    try {
      pipeline('hello');
      expect(false).toBe('Never should be reached');
    } catch (e: any) {
      expect(e.message).toBe(error.message);
    }
  });

  it("should not call the handler if an error is passed to the middleware's next function", () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn((value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn((_, next) =>
      next(error),
    );
    const pipeline = pipeSync(middleware, handler);

    try {
      pipeline('hello');
      expect(false).toBe('Never should be reached');
    } catch (_) {
      expect(handler).not.toHaveBeenCalled();
    }
  });

  it('should throw if an error is thrown in a middleware', () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn((value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn((_) => {
      throw error;
    });
    const pipeline = pipeSync(middleware, handler);

    try {
      pipeline('hello');
      expect(false).toBe('Never should be reached');
    } catch (e: any) {
      expect(e.message).toBe(error.message);
    }
  });

  it('should not call the handler if an error is thrown in a middleware', () => {
    const error = new Error("Something wrong isn't right");
    const handler = vi.fn((value: string) => `hello ${value}`);
    const middleware: Middleware<typeof handler> = vi.fn((_) => {
      throw error;
    });
    const pipeline = pipeSync(middleware, handler);

    try {
      pipeline('hello');
      expect(false).toBe('Never should be reached');
    } catch (_) {
      expect(handler).not.toHaveBeenCalled();
    }
  });
});
