import { Hono } from "hono";

import { authMiddleware } from "../../middleware/auth.js";
import { ok } from "../../lib/http.js";
import { login } from "./service.js";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
  const result = await login(await c.req.json());
  return ok(c, result);
});

authRoutes.get("/me", authMiddleware, (c) => {
  const user = c.get("user");

  return ok(c, {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  });
});
