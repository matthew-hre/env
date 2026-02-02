import type { StandardSchemaV1 } from "@standard-schema/spec";

import pc from "picocolors";

import type { LoadEnvOptions } from "./types";

export function handleClientServerErrors(
    errors: { context: "server" | "client"; issues: readonly StandardSchemaV1.Issue[] }[],
    options: LoadEnvOptions,
): void {
    let message = pc.red("Invalid environment variables:\n");

    errors.forEach(({ context, issues }) => {
        message += pc.yellow(`\n${context.toUpperCase()} variables:\n`);
        issues.forEach((issue) => {
            const segment = issue.path?.[0];
            const name = segment
                ? String(typeof segment === "object" && "key" in segment ? segment.key : segment)
                : "unknown";
            message += ` - ${pc.bold(name)} ${pc.dim(`(${issue.message})`)}\n`;
        });
    });

    console.error(message);

    if (options.exitOnError) {
        process.exit(1);
    }

    throw new Error(errors[0].issues[0]?.message ?? "Validation failed");
}

export function handleSingleSchemaError(issues: readonly StandardSchemaV1.Issue[]): void {
    let message = pc.red("Invalid environment variables:\n");
    issues.forEach((issue) => {
        const segment = issue.path?.[0];
        const name = segment
            ? String(typeof segment === "object" && "key" in segment ? segment.key : segment)
            : "unknown";
        message += ` - ${pc.bold(name)} ${pc.dim(`(${issue.message})`)}\n`;
    });
    console.error(message);
}
