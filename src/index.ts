export type AnyOperation = Operation<any, any>;
export type AnyRecord = Record<string, any>;
export type OperationsOf<T> = T extends GenericRouter<infer O> ? O : never;
export type Operation<TInput, TOutput> = [input: TInput, output: MaybePromise<TOutput>];
export type MaybePromise<T> = T | Promise<T>;
export type OperationsRecord = Record<string, (...args: any[]) => any>;
export type OperationsMap<TMap extends OperationsRecord> = {
  [Key in keyof TMap]: Operation<Parameters<TMap[Key]>[0], Awaited<ReturnType<TMap[Key]>>>;
};
export type OperationHandler<TOperation extends Operation<any, any>> = (
  input: TOperation[0],
  context?: Context<TOperation>
) => TOperation[1];
export type Context<TBody = AnyRecord, TReturn = AnyRecord> = {
  body?: TBody;
  callback?: TReturn;
} & AnyRecord;
export type Middleware<TOperations extends Record<string, AnyOperation>> = (
  context: Context<TOperations[keyof TOperations]>,
  middlewareContext: AnyRecord
) => MaybePromise<Context<TOperations[keyof TOperations]>>;

export class GenericRouter<TOperations extends OperationsRecord> {
  private operations = new Map<
    keyof TOperations,
    OperationHandler<OperationsMap<TOperations>[keyof TOperations]>
  >();
  private middlewares: {
    call: Middleware<OperationsMap<TOperations>>;
    context: Context<TOperations[keyof TOperations]>;
  }[] = [];

  constructor(operations?: OperationsRecord) {
    if (operations) {
      this.use(operations);
    }
  }
  use(operations: OperationsRecord) {
    Object.entries(operations).forEach(([operationName, operation]) => {
      this.onOperation(operationName, operation);
    });
  }

  setMiddleware(
    call: Middleware<OperationsMap<TOperations>>,
    context: Context<TOperations[keyof TOperations]>
  ) {
    this.middlewares.push({ call, context });
  }

  isOperationExist(operationName: string): boolean {
    return this.operations.has(operationName);
  }

  operationNames() {
    return this.operations.keys();
  }

  onOperation(
    operationName: keyof TOperations,
    handler: OperationHandler<OperationsMap<TOperations>[keyof TOperations]>
  ): void {
    this.operations.set(operationName, handler);
  }

  async call<TOperationName extends keyof TOperations>(
    operationName: TOperationName,
    context: Context<OperationsMap<TOperations>[keyof TOperations]>,
    input?: OperationsMap<TOperations>[TOperationName][0]
  ): Promise<OperationsMap<TOperations>[TOperationName][1]> {
    const operation = this.operations.get(operationName);

    if (!operation) {
      return { error: 'Operation not found' } as OperationsMap<TOperations>[TOperationName][1];
    }

    if (context.middleware !== false) {
      for (const middleware of this.middlewares) {
        if (context) {
          context = await middleware.call(context, middleware.context);
          if (context?.payload?.error) {
            return {
              error: context.payload.error
            } as OperationsMap<TOperations>[TOperationName][1];
          }
        }
      }
    }

    return operation(input, context) as Promise<OperationsMap<TOperations>[TOperationName][1]>;
  }
}
