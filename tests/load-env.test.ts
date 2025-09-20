import { describe, expect, it } from "vitest";
import { z } from "zod";

import { loadEnv } from "../src";

describe("loadEnv", () => {
  describe("legacy single schema format", () => {
    it("parses valid env", () => {
      const schema = z.object({ NODE_ENV: z.string() });
      const result = loadEnv(schema, { NODE_ENV: "development" }, { exitOnError: false });
      expect(result.NODE_ENV).toBe("development");
    });

    it("throws on missing env var", () => {
      const schema = z.object({ NODE_ENV: z.string() });
      expect(() =>
        loadEnv(schema, {}, { exitOnError: false }),
      ).toThrow();
    });

    it("parses complex schema", () => {
      const schema = z.object({
        NODE_ENV: z.enum(["development", "production"]),
        PORT: z.string().transform(Number),
        API_URL: z.url(),
      });

      const env = {
        NODE_ENV: "development",
        PORT: "3000",
        API_URL: "http://localhost:3000",
      };

      const result = loadEnv(schema, env, { exitOnError: false });
      expect(result.NODE_ENV).toBe("development");
      expect(result.PORT).toBe(3000);
      expect(result.API_URL).toBe("http://localhost:3000");
    });
  });

  describe("client/server schema format", () => {
    it("parses valid client and server env vars", () => {
      const schema = {
        server: z.object({
          NODE_ENV: z.enum(["development", "production"]),
          DATABASE_URL: z.url(),
        }),
        client: z.object({
          NEXT_PUBLIC_API_URL: z.url(),
        }),
      };

      const env = {
        NODE_ENV: "development",
        DATABASE_URL: "postgres://localhost:5432/db",
        NEXT_PUBLIC_API_URL: "http://localhost:3000",
      };

      const result = loadEnv(schema, env, { exitOnError: false });

      expect(result.serverEnv.NODE_ENV).toBe("development");
      expect(result.serverEnv.DATABASE_URL).toBe("postgres://localhost:5432/db");
      expect(result.clientEnv.NEXT_PUBLIC_API_URL).toBe("http://localhost:3000");
    });

    it("throws on missing server env var", () => {
      const schema = {
        server: z.object({
          NODE_ENV: z.string(),
          DATABASE_URL: z.string(),
        }),
        client: z.object({
          NEXT_PUBLIC_API_URL: z.string(),
        }),
      };

      const env = {
        NEXT_PUBLIC_API_URL: "http://localhost:3000",
      };

      expect(() =>
        loadEnv(schema, env, { exitOnError: false }),
      ).toThrow();
    });

    it("throws on missing client env var", () => {
      const schema = {
        server: z.object({
          NODE_ENV: z.string(),
        }),
        client: z.object({
          NEXT_PUBLIC_API_URL: z.string(),
        }),
      };

      const env = {
        NODE_ENV: "development",
      };

      expect(() =>
        loadEnv(schema, env, { exitOnError: false }),
      ).toThrow();
    });

    it("only passes NEXT_PUBLIC_ vars to client validation", () => {
      const schema = {
        server: z.object({
          NODE_ENV: z.string(),
        }),
        client: z.object({
          NEXT_PUBLIC_API_URL: z.string(),
        }),
      };

      const env = {
        NODE_ENV: "development",
        NEXT_PUBLIC_API_URL: "http://localhost:3000",
        SECRET_KEY: "so-secret",
      };

      const result = loadEnv(schema, env, { exitOnError: false });

      expect(result.serverEnv.NODE_ENV).toBe("development");
      expect(result.clientEnv.NEXT_PUBLIC_API_URL).toBe("http://localhost:3000");

      expect("SECRET_KEY" in result.clientEnv).toBe(false);
    });

    it("handles invalid NEXT_PUBLIC_ variable format", () => {
      const schema = {
        server: z.object({
          NODE_ENV: z.string(),
        }),
        client: z.object({
          NEXT_PUBLIC_API_URL: z.url(),
        }),
      };

      const env = {
        NODE_ENV: "development",
        NEXT_PUBLIC_API_URL: "123",
      };

      expect(() =>
        loadEnv(schema, env, { exitOnError: false }),
      ).toThrow();
    });

    it("works with empty client schema", () => {
      const schema = {
        server: z.object({
          NODE_ENV: z.string(),
        }),
        client: z.object({}),
      };

      const env = {
        NODE_ENV: "development",
        NEXT_PUBLIC_SOMETHING: "ignored",
      };

      const result = loadEnv(schema, env, { exitOnError: false });

      expect(result.serverEnv.NODE_ENV).toBe("development");
      expect(result.clientEnv).toEqual({});
    });

    it("works with empty server schema", () => {
      const schema = {
        server: z.object({}),
        client: z.object({
          NEXT_PUBLIC_API_URL: z.string(),
        }),
      };

      const env = {
        NEXT_PUBLIC_API_URL: "http://localhost:3000",
        SECRET: "ignored",
      };

      const result = loadEnv(schema, env, { exitOnError: false });

      expect(result.serverEnv).toEqual({});
      expect(result.clientEnv.NEXT_PUBLIC_API_URL).toBe("http://localhost:3000");
    });
  });
});
