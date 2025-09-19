import { ZodError, ZodObject, ZodRawShape, z } from "zod";
import pc from "picocolors";

export interface LoadEnvOptions {
    exitOnError?: boolean;
}

const defaultOptions: LoadEnvOptions = {
    exitOnError: true,
};

export function loadEnv<T extends ZodRawShape>(
    schema: ZodObject<T>,
    env: Record<string, string | undefined> = process.env,
    options: LoadEnvOptions = defaultOptions
): z.output<typeof schema> {
    try {
        return schema.parse(env);
    } catch (err) {
        if (err instanceof ZodError) {
            let message = pc.red("Invalid environment variables:\n");
            err.issues.forEach((issue) => {
                const name = String(issue.path[0]);
                message += ` - ${pc.bold(name)} ${pc.dim("(" + issue.message + ")")}\n`;
            });
            console.error(message);
        } else {
            console.error("Unexpected error while parsing env:", err);
        }
        if (options.exitOnError) {
            process.exit(1);
        }
        throw err;
    }
}