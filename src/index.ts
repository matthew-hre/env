import { ZodError, ZodObject, ZodRawShape, z } from "zod";

export function loadEnv<T extends ZodRawShape>(
    schema: ZodObject<T>,
    env: Record<string, string | undefined> = process.env
): z.output<typeof schema> {
    try {
        return schema.parse(env);
    } catch (err) {
        if (err instanceof ZodError) {
            let message = "Invalid environment variables:\n";
            err.issues.forEach((issue) => {
                message += ` - ${String(issue.path[0])} (${issue.message})\n`;
            });
            console.error(message);
        } else {
            console.error("Unexpected error while parsing env:", err);
        }
        process.exit(1);
    }
}