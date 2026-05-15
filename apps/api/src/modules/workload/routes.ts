import { Hono } from "hono";

import { ok } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";
import { getWorkload } from "./service.js";

export const workloadRoutes = new Hono();

workloadRoutes.use("*", authMiddleware);

workloadRoutes.get("/", async (c) => {
  return ok(c, await getWorkload());
});
