import { Hono } from "hono";

import { handleError, ok, readJson } from "./http.js";

describe("readJson", () => {
  it("returns a validation error for malformed JSON", async () => {
    const app = new Hono();

    app.post("/json", async (c) => ok(c, await readJson(c)));
    app.onError(handleError);

    const response = await app.request("/json", {
      method: "POST",
      body: "{",
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "请求体必须是合法的 JSON。",
      },
    });
  });
});
