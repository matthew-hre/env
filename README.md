# @matthew-hre/env

Type safe environment variable validation for NextJS projects.

> This package is mostly for my own projects, and I wouldn't recommend using it yourself in its current state. It may be improved in the future. May.

## Installation

```bash
npm install @matthew-hre/env
```

### env.ts

First, create an `env.ts` file in your project (e.g. in the `lib` folder):

```ts
// lib/env.ts
import { z } from "zod";
import { loadEnv } from "@matthew-hre/env";

const schema = z.object({
  NODE_ENV: z.string(),
  NEXT_PUBLIC_API_URL: z.url(),
});

// optionally, export the schema for use elsewhere
export type EnvSchema = z.infer<typeof schema>;

export const env = loadEnv(schema);
```

### next.config.js

Then, import and use the `env` object in your `next.config.js`:

```js
// next.config.js
import type { NextConfig } from "next";
import { env } from "src/lib/env"; // or wherever your env.ts file is

const nextConfig: NextConfig = {
  ...
};

export default nextConfig;
```

## Usage

You can now use the `env` object anywhere in your NextJS project:

```ts
import { env } from "src/lib/env"; // or wherever your env.ts file is

console.log(env.NEXT_PUBLIC_API_URL);
```

This is type safe and will give you autocompletion based on your schema. Additionally, errors will be thrown at runtime if the environment variables do not match the schema.

## Configuration

The `loadEnv` function accepts two optional parameters: `env` and `options`.

- `env`: An object representing the environment variables to validate. Defaults to `process.env`.
- `options`: An object containing options to customize the behavior of the `loadEnv` function.
  - `exitOnError`: If set to `true`, the process will exit with a non-zero status code if the environment variables are invalid. Defaults to `true`.

## License

Matthew Hrehirchuk © 2025. Licensed under the MIT License.
