/* eslint-disable @typescript-eslint/no-explicit-any */
export type Handler<
  Args extends Array<any> = Array<any>,
  Return extends Promise<any> = any,
> = (...args: Args) => Return;

export type SyncHandler<
  Args extends Array<any> = Array<any>,
  Return = any,
> = Return extends Promise<any> ? never : (...args: Args) => Return;

export type Next<FinalHandler extends Handler> = {
  (error?: Error | null): ReturnType<FinalHandler>;
  (
    error?: Error | null,
    ...args: Parameters<FinalHandler>
  ): ReturnType<FinalHandler>;
};

export type Push<Current extends Array<any>, NewValue> = [...Current, NewValue];

export type Middleware<FinalHandler extends Handler> = (
  ...args: Push<Parameters<FinalHandler>, Next<FinalHandler>>
) => ReturnType<FinalHandler>;

function isError(maybeError: unknown): maybeError is Error {
  return (
    maybeError != null &&
    typeof maybeError === 'object' &&
    maybeError instanceof Error &&
    maybeError.message != null &&
    typeof maybeError.message === 'string'
  );
}

export function pipe<FinalHandler extends Handler>(
  ...handlers: Push<Middleware<FinalHandler>[], FinalHandler>
): (
  ...args: Parameters<FinalHandler>
) => Promise<Awaited<ReturnType<FinalHandler>>> {
  const handler = handlers[handlers.length - 1] as FinalHandler;
  const middlewares: Middleware<FinalHandler>[] = handlers.slice(0, -1);

  return async function PipeHandler(
    ...args: Parameters<FinalHandler>
  ): Promise<Awaited<ReturnType<FinalHandler>>> {
    let index = 0;
    async function next(
      error?: Error | null,
      ...nextArgs: Parameters<FinalHandler>
    ) {
      try {
        if (error) {
          throw error;
        }

        const newArgs = args.map(
          (arg, index) => nextArgs[index] ?? arg,
        ) as Parameters<FinalHandler>;

        const middleware = middlewares[index++];
        return middleware
          ? await middleware(...newArgs, next as Next<FinalHandler>)
          : await handler(...newArgs);
      } catch (maybeError) {
        throw isError(maybeError)
          ? maybeError
          : new Error(`Error while handling middlewares: ${maybeError}`);
      }
    }

    return await next(null, ...args);
  };
}
export function pipeSync<FinalHandler extends SyncHandler>(
  ...handlers: Push<Middleware<FinalHandler>[], FinalHandler>
): (...args: Parameters<FinalHandler>) => ReturnType<FinalHandler> {
  const handler = handlers[handlers.length - 1] as FinalHandler;
  const middlewares: Middleware<FinalHandler>[] = handlers.slice(0, -1);

  return function PipeHandler(
    ...args: Parameters<FinalHandler>
  ): ReturnType<FinalHandler> {
    let index = 0;
    function next(error?: Error | null, ...nextArgs: Parameters<FinalHandler>) {
      try {
        if (error) {
          throw error;
        }

        const newArgs = args.map(
          (arg, index) => nextArgs[index] ?? arg,
        ) as Parameters<FinalHandler>;

        const middleware = middlewares[index++];
        return middleware
          ? middleware(...newArgs, next as Next<FinalHandler>)
          : handler(...newArgs);
      } catch (maybeError) {
        throw isError(maybeError)
          ? maybeError
          : new Error(`Error while handling middlewares: ${maybeError}`);
      }
    }

    return next(null, ...args);
  };
}
