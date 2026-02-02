import type { StandardSchemaV1 } from "@standard-schema/spec";

import type { ClientServerSchema, LoadEnvOptions, LoadEnvResult } from "./types";

import { handleClientServerErrors, handleSingleSchemaError } from "./error-handling";

function isStandardSchema(schema: unknown): schema is StandardSchemaV1 {
  return (
    schema !== null
    && typeof schema === "object"
    && "~standard" in schema
    && typeof (schema as StandardSchemaV1)["~standard"].validate === "function"
  );
}

function validateSync<I, O>(
  schema: StandardSchemaV1<I, O>,
  input: I,
): StandardSchemaV1.Result<O> {
  const result = schema["~standard"].validate(input);
  if (result instanceof Promise) {
    throw new TypeError("Async validation is not supported. Use a synchronous schema.");
  }
  return result;
}

const defaultOptions: LoadEnvOptions = {
  exitOnError: true,
};

// overload for different schema types
export function loadEnv<T extends ClientServerSchema>(
  schema: T,
  env?: Record<string, string | undefined>,
  options?: LoadEnvOptions
): LoadEnvResult<T>;

export function loadEnv<T extends StandardSchemaV1<Record<string, string | undefined>, any>>(
  schema: T,
  env?: Record<string, string | undefined>,
  options?: LoadEnvOptions
): LoadEnvResult<T>;

export function loadEnv<T extends StandardSchemaV1 | ClientServerSchema>(
  schema: T,
  env: Record<string, string | undefined> = process.env,
  options: LoadEnvOptions = defaultOptions,
): any {
  if (options.skipValidation) {
    if (isClientServerSchema(schema)) {
      return { serverEnv: env, clientEnv: env };
    }
    return env;
  }

  if (isClientServerSchema(schema)) {
    return parseClientServerSchema(schema, env, options);
  }
  else {
    return parseSingleSchema(schema as StandardSchemaV1, env, options);
  }
}

function isClientServerSchema(schema: any): schema is ClientServerSchema {
  return (
    typeof schema === "object"
    && schema !== null
    && "server" in schema
    && "client" in schema
    && isStandardSchema(schema.server)
    && isStandardSchema(schema.client)
  );
}

function parseClientServerSchema(
  schema: ClientServerSchema,
  env: Record<string, string | undefined>,
  options: LoadEnvOptions,
): { serverEnv: any; clientEnv: any } {
  const errors: { context: "server" | "client"; issues: readonly StandardSchemaV1.Issue[] }[] = [];
  let serverEnv: any;
  let clientEnv: any;

  const isServer = typeof window === "undefined";

  // server environment variables
  if (isServer) {
    const result = validateSync(schema.server, env);
    if ("issues" in result && result.issues) {
      errors.push({ context: "server", issues: result.issues });
    }
    else {
      serverEnv = result.value;
    }
  }
  else {
    serverEnv = new Proxy({}, {
      get: () => {
        throw new Error("❌ Attempted to access a server-side environment variable on the client");
      },
    });
  }

  // client environment variables
  // (only handling NEXT_PUBLIC_ prefixed variables rn)
  const clientEnv_variables = Object.fromEntries(
    Object.entries(env).filter(([key]) => key.startsWith("NEXT_PUBLIC_")),
  );

  const clientResult = validateSync(schema.client, clientEnv_variables);
  if ("issues" in clientResult && clientResult.issues) {
    errors.push({ context: "client", issues: clientResult.issues });
  }
  else {
    clientEnv = clientResult.value;
  }

  if (errors.length > 0) {
    handleClientServerErrors(errors, options);
  }

  return { serverEnv, clientEnv };
}

// legacy single schema format
function parseSingleSchema(
  schema: StandardSchemaV1,
  env: Record<string, string | undefined>,
  options: LoadEnvOptions,
): any {
  const result = validateSync(schema, env);

  if ("issues" in result && result.issues) {
    handleSingleSchemaError(result.issues);
    if (options.exitOnError) {
      process.exit(1);
    }
    throw new Error(result.issues[0]?.message ?? "Validation failed");
  }

  return result.value;
}
