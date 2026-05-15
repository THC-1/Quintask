import { createTagSchema, UserRole } from "@quintask/shared";
import { Hono } from "hono";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { created, ok, readJson } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";

export const tagRoutes = new Hono();

tagRoutes.use("*", authMiddleware);

tagRoutes.get("/", async (c) => {
  return ok(
    c,
    await prisma.tag.findMany({
      orderBy: { name: "asc" },
    }),
  );
});

tagRoutes.post("/", async (c) => {
  const user = c.get("user");

  if (user.role !== UserRole.OWNER) {
    throw errors.forbidden();
  }

  const parsed = createTagSchema.safeParse(await readJson(c));

  if (!parsed.success) {
    throw errors.validation(parsed.error.issues[0]?.message ?? "请求参数不正确");
  }

  return created(
    c,
    await prisma.tag.create({
      data: parsed.data,
    }),
  );
});
