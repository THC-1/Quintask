import { Hono } from "hono";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { ok } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";

export const projectRoutes = new Hono();

projectRoutes.use("*", authMiddleware);

projectRoutes.get("/current", async (c) => {
  const project = await prisma.project.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!project) {
    throw errors.notFound("项目不存在。");
  }

  return ok(c, project);
});
