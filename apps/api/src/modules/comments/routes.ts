import { createCommentSchema, UserRole } from "@quintask/shared";
import { Hono } from "hono";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { created, readJson } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";
import { canCreateCommentType } from "./permissions.js";

export const commentRoutes = new Hono();

commentRoutes.use("*", authMiddleware);

commentRoutes.post("/tasks/:taskId/comments", async (c) => {
  const user = c.get("user");

  if (user.role === UserRole.TEACHER) {
    throw errors.forbidden();
  }

  const parsed = createCommentSchema.safeParse(await readJson(c));

  if (!parsed.success) {
    throw errors.validation(parsed.error.issues[0]?.message ?? "请求参数不正确");
  }

  if (!canCreateCommentType(user.role, parsed.data.type)) {
    throw errors.forbidden();
  }

  const task = await prisma.task.findUnique({
    where: { id: c.req.param("taskId") },
    select: { id: true },
  });

  if (!task) {
    throw errors.notFound("任务不存在。");
  }

  return created(
    c,
    await prisma.taskComment.create({
      data: {
        taskId: task.id,
        authorId: user.id,
        content: parsed.data.content,
        type: parsed.data.type,
      },
    }),
  );
});
