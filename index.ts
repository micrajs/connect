import {HTTPError, isMicraError, WrappedError} from '@micra/error';

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
    const next = async function next(
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
        const error = isMicraError(maybeError)
          ? maybeError
          : new WrappedError(
              (maybeError as any) instanceof Error
                ? maybeError
                : new HTTPError(
                    500,
                    `Error while handling middlewares: ${maybeError}`,
                  ),
            );

        throw error;
      }
    };

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
    const next = function next(
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
          ? middleware(...newArgs, next as Next<FinalHandler>)
          : handler(...newArgs);
      } catch (maybeError) {
        const error = isMicraError(maybeError)
          ? maybeError
          : new WrappedError(
              (maybeError as any) instanceof Error
                ? maybeError
                : new HTTPError(
                    500,
                    `Error while handling middlewares: ${maybeError}`,
                  ),
            );

        throw error;
      }
    };

    return next(null, ...args);
  };
}
