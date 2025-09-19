import { describe, it, expect } from "vitest";
import { z } from "zod";
import { loadEnv } from "../src";

describe("loadEnv", () => {
    it("parses valid env", () => {
        const schema = z.object({ NODE_ENV: z.string() });
        const result = loadEnv(schema, { NODE_ENV: "development" }, { exitOnError: false });
        expect(result.NODE_ENV).toBe("development");
    });

    it("throws on missing env var", () => {
        const schema = z.object({ NODE_ENV: z.string() });
        expect(() =>
            loadEnv(schema, {}, { exitOnError: false })
        ).toThrow();
    });
});