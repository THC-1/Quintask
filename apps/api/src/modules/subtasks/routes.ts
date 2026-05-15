import { createSubtaskSchema, updateSubtaskSchema, UserRole } from "@quintask/shared";
import { Hono } from "hono";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { created, ok, readJson } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";

export const subtaskRoutes = new Hono();

subtaskRoutes.use("*", authMiddleware);

subtaskRoutes.post("/tasks/:taskId/subtasks", async (c) => {
  const user = c.get("user");

  if (user.role === UserRole.TEACHER) {
    throw errors.forbidden();
  }

  const parsed = createSubtaskSchema.safeParse(await readJson(c));

  if (!parsed.success) {
    throw errors.validation(parsed.error.issues[0]?.message ?? "请求参数不正确");
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
    await prisma.subtask.create({
      data: {
        taskId: task.id,
        title: parsed.data.title,
        assigneeId: parsed.data.assigneeId ?? null,
        sortOrder: parsed.data.sortOrder,
      },
    }),
  );
});

subtaskRoutes.patch("/subtasks/:id", async (c) => {
  const user = c.get("user");

  if (user.role === UserRole.TEACHER) {
    throw errors.forbidden();
  }

  const parsed = updateSubtaskSchema.safeParse(await readJson(c));

  if (!parsed.success) {
    throw errors.validation(parsed.error.issues[0]?.message ?? "请求参数不正确");
  }

  const subtask = await prisma.subtask.findUnique({
    where: { id: c.req.param("id") },
    select: { id: true },
  });

  if (!subtask) {
    throw errors.notFound("子任务不存在。");
  }

  return ok(
    c,
    await prisma.subtask.update({
      where: { id: subtask.id },
      data: parsed.data,
    }),
  );
});
