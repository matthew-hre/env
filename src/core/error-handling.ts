import type { ZodError } from "zod";

import pc from "picocolors";

import type { LoadEnvOptions } from "./types";

export function handleClientServerErrors(
  errors: { context: "server" | "client"; error: ZodError }[],
  options: LoadEnvOptions,
): void {
  let message = pc.red("Invalid environment variables:\n");

  errors.forEach(({ context, error }) => {
    message += pc.yellow(`\n${context.toUpperCase()} variables:\n`);
    error.issues.forEach((issue) => {
      const name = String(issue.path[0]);
      message += ` - ${pc.bold(name)} ${pc.dim(`(${issue.message})`)}\n`;
    });
  });

  console.error(message);

  if (options.exitOnError) {
    process.exit(1);
  }

  throw errors[0].error;
}

export function handleSingleSchemaError(error: ZodError): void {
  let message = pc.red("Invalid environment variables:\n");
  error.issues.forEach((issue) => {
    const name = String(issue.path[0]);
    message += ` - ${pc.bold(name)} ${pc.dim(`(${issue.message})`)}\n`;
  });
  console.error(message);
}
