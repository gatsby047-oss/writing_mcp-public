import { describe, expect, it } from "vitest";
import { fail, ok } from "@/lib/server/api-response";

describe("api-response", () => {
  it("sets utf-8 json content type for successful responses", async () => {
    const response = ok({ message: "中文内容" });

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("content-type")).toContain("charset=utf-8");
    await expect(response.json()).resolves.toEqual({ message: "中文内容" });
  });

  it("sets utf-8 json content type for error responses", async () => {
    const response = fail("请求失败", 422);

    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toContain("charset=utf-8");
    await expect(response.json()).resolves.toEqual({ error: "请求失败" });
  });
});
