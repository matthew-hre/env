import type { StandardSchemaV1 } from "@standard-schema/spec";

export type LoadEnvOptions = {
  exitOnError?: boolean;
  skipValidation?: boolean;
};

export type ClientServerSchema = {
  server: StandardSchemaV1<Record<string, string | undefined>, Record<string, unknown>>;
  client: StandardSchemaV1<Record<string, string | undefined>, Record<string, unknown>>;
};

export type IsClientServerSchema<T> = T extends ClientServerSchema ? true : false;

/*
 * this thing is gnarly: basically, if T is a ClientServerSchema,
 * we want to return { serverEnv: ..., clientEnv: ... }
 * otherwise, if T is a StandardSchemaV1, we just return the parsed env object
 */
export type LoadEnvResult<T> = IsClientServerSchema<T> extends true
  ? T extends { server: infer S; client: infer C }
    ? S extends StandardSchemaV1<any, infer SO>
      ? C extends StandardSchemaV1<any, infer CO>
        ? { serverEnv: SO; clientEnv: CO }
        : never
      : never
    : never
  : T extends StandardSchemaV1<any, infer O>
    ? O
    : never;
