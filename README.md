# @matthew-hre/env

Type safe environment variable validation for NextJS projects with support for client/server separation.

> This package is mostly for my own projects, and I wouldn't recommend using it yourself in its current state. It may be improved in the future. May.

## Installation

```bash
npm install @matthew-hre/env
```

## Usage

### Client/Server Schema (Recommended)

For NextJS projects, you can separate client and server environment variables for better security and type safety:

```ts
// lib/env.ts
import { loadEnv } from "@matthew-hre/env";
import { z } from "zod";

const schema = {
  server: z.object({
    NODE_ENV: z.enum(["development", "production"]),
    DATABASE_URL: z.string().url(),
    SECRET_KEY: z.string(),
  }),
  client: z.object({
    NEXT_PUBLIC_API_URL: z.string().url(),
    NEXT_PUBLIC_APP_NAME: z.string(),
  }),
};

// optionally, export the schemas for use elsewhere
export type ServerEnvSchema = z.infer<typeof schema.server>;
export type ClientEnvSchema = z.infer<typeof schema.client>;

export const { serverEnv, clientEnv } = loadEnv(schema);
```

### Legacy Single Schema

For simpler projects or backward compatibility, you can still use the original single schema format:

```ts
import { loadEnv } from "@matthew-hre/env";
// lib/env.ts
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string(),
  NEXT_PUBLIC_API_URL: z.url(),
});

// optionally, export the schema for use elsewhere
export type EnvSchema = z.infer<typeof schema>;

export const env = loadEnv(schema);
```

### next.config.js

Import the `env` file in your `next.config.js`. This is enough to ensure the environment variables are validated at build time.

```ts
// next.config.ts
import type { NextConfig } from "next";

import "src/lib/env";

const nextConfig: NextConfig = {
  // ...
};

export default nextConfig;
```

## Examples

### Using Client/Server Environment Variables

```ts
// server-side code (api routes, etc.)
import { clientEnv, serverEnv } from "src/lib/env";

export async function GET() {
  // can access both server and client variables
  const dbUrl = serverEnv.DATABASE_URL;
  const apiUrl = clientEnv.NEXT_PUBLIC_API_URL;

  // full type safety and autocompletion
  return fetch(`${apiUrl}/data`, {
    headers: { authorization: serverEnv.SECRET_KEY }
  });
}
```

```tsx
// client-side code (components, hooks, etc.)
"use client";

import { clientEnv } from "src/lib/env";

export function ApiClient() {
  // can access client variables
  const apiUrl = clientEnv.NEXT_PUBLIC_API_URL;

  return (
    <span>
      API URL:
      {apiUrl}
    </span>
  );
}
```

### Environment Variable Validation

```ts
const schema = {
  server: z.object({
    NODE_ENV: z.enum(["development", "production"]),
    DATABASE_URL: z.url(),
  }),
  client: z.object({
    NEXT_PUBLIC_API_URL: z.url(),
  }),
};
```

## Configuration

The `loadEnv` function accepts optional parameters:

- `env`: An object representing the environment variables to validate. Defaults to `process.env`.
- `options`: An object containing options to customize the behavior:
  - `exitOnError`: If set to `true`, the process will exit with a non-zero status code if the environment variables are invalid. Defaults to `true`.

```ts
const customEnv = { NODE_ENV: "test", NEXT_PUBLIC_API_URL: "http://localhost:3000" };
const { serverEnv, clientEnv } = loadEnv(schema, customEnv);

const { serverEnv, clientEnv } = loadEnv(schema, process.env, { exitOnError: false });
```

## License

Matthew Hrehirchuk © 2025. Licensed under the MIT License.
