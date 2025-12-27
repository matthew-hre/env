import type { ZodRawShape } from "zod";

import { ZodError, ZodObject } from "zod";

import type { ClientServerSchema, LoadEnvOptions, LoadEnvResult } from "./types";

import { handleClientServerErrors, handleSingleSchemaError } from "./error-handling";

const defaultOptions: LoadEnvOptions = {
  exitOnError: true,
};

// overload for different schema types
export function loadEnv<T extends ClientServerSchema>(
  schema: T,
  env?: Record<string, string | undefined>,
  options?: LoadEnvOptions
): LoadEnvResult<T>;

export function loadEnv<T extends ZodRawShape>(
  schema: ZodObject<T>,
  env?: Record<string, string | undefined>,
  options?: LoadEnvOptions
): LoadEnvResult<ZodObject<T>>;

export function loadEnv<T extends ZodObject<any> | ClientServerSchema>(
  schema: T,
  env: Record<string, string | undefined> = process.env,
  options: LoadEnvOptions = defaultOptions,
): any {
  if (isClientServerSchema(schema)) {
    return parseClientServerSchema(schema, env, options);
  }
  else {
    return parseSingleSchema(schema as ZodObject<any>, env, options);
  }
}

function isClientServerSchema(schema: any): schema is ClientServerSchema {
  return (
    typeof schema === "object"
    && schema !== null
    && "server" in schema
    && "client" in schema
    && schema.server instanceof ZodObject
    && schema.client instanceof ZodObject
  );
}

function parseClientServerSchema(
  schema: ClientServerSchema,
  env: Record<string, string | undefined>,
  options: LoadEnvOptions,
): { serverEnv: any; clientEnv: any } {
  const errors: { context: "server" | "client"; error: ZodError }[] = [];
  let serverEnv: any;
  let clientEnv: any;

  const isServer = typeof window === "undefined";

  // server environment variables
  if (isServer) {
    try {
      serverEnv = schema.server.parse(env);
    }
    catch (err) {
      if (err instanceof ZodError) {
        errors.push({ context: "server", error: err });
      }
      else {
        throw err;
      }
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

  try {
    clientEnv = schema.client.parse(clientEnv_variables);
  }
  catch (err) {
    if (err instanceof ZodError) {
      errors.push({ context: "client", error: err });
    }
    else {
      throw err;
    }
  }

  if (errors.length > 0) {
    handleClientServerErrors(errors, options);
  }

  return { serverEnv, clientEnv };
}

// legacy single schema format
function parseSingleSchema(
  schema: ZodObject<any>,
  env: Record<string, string | undefined>,
  options: LoadEnvOptions,
): any {
  try {
    return schema.parse(env);
  }
  catch (err) {
    if (err instanceof ZodError) {
      handleSingleSchemaError(err);
    }
    else {
      console.error("Unexpected error while parsing env:", err);
    }
    if (options.exitOnError) {
      process.exit(1);
    }
    throw err;
  }
}
