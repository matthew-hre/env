import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { loadEnv } from "../src";

describe("loadEnv with Valibot", () => {
  describe("legacy single schema format", () => {
    it("parses valid env", () => {
      const schema = v.object({ NODE_ENV: v.string() });
      const result = loadEnv(schema, { NODE_ENV: "development" }, { exitOnError: false });
      expect(result.NODE_ENV).toBe("development");
    });

    it("throws on missing env var", () => {
      const schema = v.object({ NODE_ENV: v.string() });
      expect(() =>
        loadEnv(schema, {}, { exitOnError: false }),
      ).toThrow();
    });

    it("skips validation when skipValidation is true", () => {
      const schema = v.object({ NODE_ENV: v.string() });
      const result = loadEnv(schema, {}, { skipValidation: true });
      expect(result).toEqual({});
    });

    it("parses complex schema", () => {
      const schema = v.object({
        NODE_ENV: v.picklist(["development", "production"]),
        PORT: v.pipe(v.string(), v.transform(Number)),
        API_URL: v.pipe(v.string(), v.url()),
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
        server: v.object({
          NODE_ENV: v.picklist(["development", "production"]),
          DATABASE_URL: v.pipe(v.string(), v.url()),
        }),
        client: v.object({
          NEXT_PUBLIC_API_URL: v.pipe(v.string(), v.url()),
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
        server: v.object({
          NODE_ENV: v.string(),
          DATABASE_URL: v.string(),
        }),
        client: v.object({
          NEXT_PUBLIC_API_URL: v.string(),
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
        server: v.object({
          NODE_ENV: v.string(),
        }),
        client: v.object({
          NEXT_PUBLIC_API_URL: v.string(),
        }),
      };

      const env = {
        NODE_ENV: "development",
      };

      expect(() =>
        loadEnv(schema, env, { exitOnError: false }),
      ).toThrow();
    });

    it("skips validation when skipValidation is true", () => {
      const schema = {
        server: v.object({
          NODE_ENV: v.string(),
          DATABASE_URL: v.string(),
        }),
        client: v.object({
          NEXT_PUBLIC_API_URL: v.string(),
        }),
      };

      const result = loadEnv(schema, {}, { skipValidation: true });
      expect(result.serverEnv).toEqual({});
      expect(result.clientEnv).toEqual({});
    });

    it("only passes NEXT_PUBLIC_ vars to client validation", () => {
      const schema = {
        server: v.object({
          NODE_ENV: v.string(),
        }),
        client: v.object({
          NEXT_PUBLIC_API_URL: v.string(),
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
        server: v.object({
          NODE_ENV: v.string(),
        }),
        client: v.object({
          NEXT_PUBLIC_API_URL: v.pipe(v.string(), v.url()),
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
        server: v.object({
          NODE_ENV: v.string(),
        }),
        client: v.object({}),
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
        server: v.object({}),
        client: v.object({
          NEXT_PUBLIC_API_URL: v.string(),
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
