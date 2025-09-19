import { ZodError, ZodObject, ZodRawShape, z } from "zod";
import pc from "picocolors";

export interface LoadEnvOptions {
    exitOnError?: boolean;
}

const defaultOptions: LoadEnvOptions = {
    exitOnError: true,
};

export interface ClientServerSchema {
    server: ZodObject<any>;
    client: ZodObject<any>;
}

type IsClientServerSchema<T> = T extends ClientServerSchema ? true : false;

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
    options: LoadEnvOptions = defaultOptions
): any {
    if (isClientServerSchema(schema)) {
        return parseClientServerSchema(schema, env, options);
    } else {
        return parseSingleSchema(schema as ZodObject<any>, env, options);
    }
}

function isClientServerSchema(schema: any): schema is ClientServerSchema {
    return (
        typeof schema === 'object' &&
        schema !== null &&
        'server' in schema &&
        'client' in schema &&
        schema.server instanceof ZodObject &&
        schema.client instanceof ZodObject
    );
}

function parseClientServerSchema(
    schema: ClientServerSchema,
    env: Record<string, string | undefined>,
    options: LoadEnvOptions
): { serverEnv: any; clientEnv: any } {
    const errors: { context: 'server' | 'client'; error: ZodError }[] = [];
    let serverEnv: any;
    let clientEnv: any;

    // server environment variables
    try {
        serverEnv = schema.server.parse(env);
    } catch (err) {
        if (err instanceof ZodError) {
            errors.push({ context: 'server', error: err });
        } else {
            throw err;
        }
    }

    // client environment variables
    // (only handling NEXT_PUBLIC_ prefixed variables rn)
    const clientEnv_variables = Object.fromEntries(
        Object.entries(env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    );

    try {
        clientEnv = schema.client.parse(clientEnv_variables);
    } catch (err) {
        if (err instanceof ZodError) {
            errors.push({ context: 'client', error: err });
        } else {
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
    options: LoadEnvOptions
): any {
    try {
        return schema.parse(env);
    } catch (err) {
        if (err instanceof ZodError) {
            handleSingleSchemaError(err);
        } else {
            console.error("Unexpected error while parsing env:", err);
        }
        if (options.exitOnError) {
            process.exit(1);
        }
        throw err;
    }
}

function handleClientServerErrors(
    errors: { context: 'server' | 'client'; error: ZodError }[],
    options: LoadEnvOptions
): void {
    let message = pc.red("Invalid environment variables:\n");

    errors.forEach(({ context, error }) => {
        message += pc.yellow(`\n${context.toUpperCase()} variables:\n`);
        error.issues.forEach((issue) => {
            const name = String(issue.path[0]);
            message += ` - ${pc.bold(name)} ${pc.dim("(" + issue.message + ")")}\n`;
        });
    });

    console.error(message);

    if (options.exitOnError) {
        process.exit(1);
    }

    throw errors[0].error;
}

function handleSingleSchemaError(error: ZodError): void {
    let message = pc.red("Invalid environment variables:\n");
    error.issues.forEach((issue) => {
        const name = String(issue.path[0]);
        message += ` - ${pc.bold(name)} ${pc.dim("(" + issue.message + ")")}\n`;
    });
    console.error(message);
}