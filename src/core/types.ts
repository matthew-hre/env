import type { z, ZodObject } from "zod";

export type LoadEnvOptions = {
  exitOnError?: boolean;
};

export type ClientServerSchema = {
  server: ZodObject<any>;
  client: ZodObject<any>;
};

export type IsClientServerSchema<T> = T extends ClientServerSchema ? true : false;

/*
 * this thing is gnarly: basically, if T is a ClientServerSchema,
 * we want to return { serverEnv: ..., clientEnv: ... }
 * otherwise, if T is a ZodObject, we just return the parsed env object
 */
export type LoadEnvResult<T> = IsClientServerSchema<T> extends true
  ? T extends { server: infer S; client: infer C }
    ? S extends ZodObject<any>
      ? C extends ZodObject<any>
        ? { serverEnv: z.output<S>; clientEnv: z.output<C> }
        : never
      : never
    : never
  : T extends ZodObject<infer R>
    ? z.output<ZodObject<R>>
    : never;
