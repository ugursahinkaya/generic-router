import {
  AnyRecord,
  Context,
  Middleware,
  OperationHandler,
  OperationsMap,
  OperationPayload,
  OperationsRecord,
  LogLevel
} from '@ugursahinkaya/shared-types';
import { Logger } from '@ugursahinkaya/logger';

export class GenericRouter<TOperations extends OperationsRecord> {
  private operations = new Map<
    keyof TOperations,
    OperationHandler<OperationsMap<TOperations>[keyof TOperations]>
  >();
  private middlewares: {
    call: Middleware<OperationsMap<TOperations>>;
    context: Context<TOperations[keyof TOperations]>;
  }[] = [];
  protected logger: Logger;

  constructor(operations: TOperations, logLevel?: LogLevel) {
    this.logger = new Logger('secure-auth', logLevel);
    if (operations) {
      this.use(operations);
    }
  }
  protected async callOperation<TOperationName extends keyof TOperations>(
    operationName: TOperationName,
    context: Context<OperationsMap<TOperations>[keyof TOperations], AnyRecord>,
    input?: OperationsMap<TOperations>[TOperationName][0]
  ) {
    const operation = this.operations.get(operationName);

    if (!operation) {
      return { error: 'Operation not found' } as ReturnType<TOperations[TOperationName]>;
    }
    if (operation.length > 0 && !input) {
      return { error: 'payload must be provided' } as ReturnType<TOperations[TOperationName]>;
    }

    if (context.middleware !== false) {
      for (const middleware of this.middlewares) {
        if (context) {
          const contextRes = await middleware.call(context, middleware.context);
          if (contextRes?.payload?.error) {
            return {
              error: contextRes.payload.error
            } as ReturnType<TOperations[TOperationName]>;
          }
        }
      }
    }

    return operation(input, context) as ReturnType<TOperations[TOperationName]>;
  }

  call<TName extends keyof TOperations>(
    operation: TName,
    context: Context<OperationsMap<TOperations>[TName]> | undefined,
    payload: OperationPayload<TOperations, TName>
  ): Promise<ReturnType<TOperations[TName]>>;

  call<TName extends keyof TOperations>(
    operation: TName,
    payload: OperationPayload<TOperations, TName>
  ): Promise<ReturnType<TOperations[TName]>>;

  call<TName extends keyof TOperations>(operation: TName): Promise<ReturnType<TOperations[TName]>>;

  call<TName extends keyof TOperations>(
    operation: TName,
    contextOrPayload?:
      | Context<OperationsMap<TOperations>[TName]>
      | OperationsMap<TOperations>[TName][0],
    payload?: OperationPayload<TOperations, TName>
  ): Promise<ReturnType<TOperations[TName]>> {
    if (arguments.length === 3) {
      return this.callOperation(
        operation,
        contextOrPayload as Context<OperationsMap<TOperations>[keyof TOperations], AnyRecord>,
        payload
      );
    } else if (arguments.length === 2) {
      return this.callOperation(operation, {}, contextOrPayload);
    } else {
      return this.callOperation(operation, {});
    }
  }
  use(operations: OperationsRecord) {
    Object.entries(operations).forEach(([operationName, operation]) => {
      if (operation) {
        this.onOperation(operationName, operation);
      }
    });
  }
  setMiddleware(
    call: Middleware<OperationsMap<TOperations>>,
    context: Context<TOperations[keyof TOperations]>
  ) {
    this.middlewares.push({ call, context });
  }
  isOperationExists(operationName: string) {
    return this.operations.has(operationName);
  }
  operationNames() {
    const keysArray = [];
    for (let key of this.operations.keys()) {
      keysArray.push(key);
    }
    return keysArray as string[];
  }
  onOperation(
    operationName: keyof TOperations,
    handler: OperationHandler<OperationsMap<TOperations>[keyof TOperations]>
  ): void {
    this.operations.set(operationName, handler);
  }
}
