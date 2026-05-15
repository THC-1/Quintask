import { createSubtaskSchema, updateSubtaskSchema, UserRole } from "@quintask/shared";
import { Hono } from "hono";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { created, ok, readJson } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";
import { canWriteSubtask, getUnsupportedMemberSubtaskUpdateFields } from "./permissions.js";

export const subtaskRoutes = new Hono();

subtaskRoutes.use("*", authMiddleware);

async function validateSubtaskAssignee(assigneeId: string | null | undefined) {
  if (assigneeId === undefined || assigneeId === null) {
    return;
  }

  const assignee = await prisma.user.findFirst({
    where: { id: assigneeId, isActive: true },
    select: { id: true },
  });

  if (!assignee) {
    throw errors.validation("子任务执行人不存在。");
  }
}

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
    select: { id: true, assigneeId: true },
  });

  if (!task) {
    throw errors.notFound("任务不存在。");
  }

  if (!canWriteSubtask(user.role, user.id, task.assigneeId)) {
    throw errors.forbidden();
  }

  await validateSubtaskAssignee(parsed.data.assigneeId);

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

  const input = await readJson(c);
  const parsed = updateSubtaskSchema.safeParse(input);

  if (!parsed.success) {
    throw errors.validation(parsed.error.issues[0]?.message ?? "请求参数不正确");
  }

  const subtask = await prisma.subtask.findUnique({
    where: { id: c.req.param("id") },
    select: {
      id: true,
      task: { select: { assigneeId: true } },
    },
  });

  if (!subtask) {
    throw errors.notFound("子任务不存在。");
  }

  if (!canWriteSubtask(user.role, user.id, subtask.task.assigneeId)) {
    throw errors.forbidden();
  }

  if (
    user.role === UserRole.MEMBER &&
    typeof input === "object" &&
    input !== null &&
    getUnsupportedMemberSubtaskUpdateFields(input).length > 0
  ) {
    throw errors.validation("成员只能更新子任务完成状态。");
  }

  await validateSubtaskAssignee(parsed.data.assigneeId);

  return ok(
    c,
    await prisma.subtask.update({
      where: { id: subtask.id },
      data: parsed.data,
    }),
  );
});
