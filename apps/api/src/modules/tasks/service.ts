import type { Prisma, User } from "@prisma/client";
import {
  TaskStatus,
  UserRole,
  changeTaskStatusSchema,
  createTaskSchema,
  updateTaskSchema,
  type UserRole as SharedUserRole,
} from "@quintask/shared";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { canChangeTaskStatus } from "./task-state.js";

const safeUserSelect = {
  id: true,
  name: true,
} as const;

type CurrentUser = Pick<User, "id" | "role">;

function firstIssueMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "请求参数不正确";
}

function parseDateInput(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value === null ? null : new Date(value);
}

export function listTasks() {
  return prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      assignee: { select: safeUserSelect },
      milestone: true,
      dependencies: { include: { dependsOnTask: true } },
      tags: { include: { tag: true } },
    },
  });
}

export async function getTask(id: string) {
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: safeUserSelect },
      creator: { select: safeUserSelect },
      reviewer: { select: safeUserSelect },
      milestone: true,
      dependencies: { include: { dependsOnTask: true } },
      subtasks: { orderBy: { sortOrder: "asc" } },
      comments: {
        include: { author: { select: safeUserSelect } },
        orderBy: { createdAt: "desc" },
      },
      tags: { include: { tag: true } },
    },
  });

  if (!task) {
    throw errors.notFound("任务不存在。");
  }

  return task;
}

export async function createTask(input: unknown, currentUser: CurrentUser) {
  if (currentUser.role === UserRole.TEACHER) {
    throw errors.forbidden();
  }

  const parsed = createTaskSchema.safeParse(input);

  if (!parsed.success) {
    throw errors.validation(firstIssueMessage(parsed.error));
  }

  const project = await prisma.project.findFirst();

  if (!project) {
    throw errors.notFound("项目不存在。");
  }

  const isOwner = currentUser.role === UserRole.OWNER;

  return prisma.task.create({
    data: {
      projectId: project.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      creatorId: currentUser.id,
      assigneeId: isOwner ? (parsed.data.assigneeId ?? null) : null,
      milestoneId: isOwner ? (parsed.data.milestoneId ?? null) : null,
      dueDate: parseDateInput(parsed.data.dueDate),
      tags: {
        create: parsed.data.tagIds.map((tagId) => ({ tagId })),
      },
      dependencies: {
        create: parsed.data.dependencyIds.map((dependsOnTaskId) => ({ dependsOnTaskId })),
      },
    },
    include: {
      assignee: { select: safeUserSelect },
      milestone: true,
      dependencies: { include: { dependsOnTask: true } },
      tags: { include: { tag: true } },
    },
  });
}

export async function updateTask(id: string, input: unknown, currentUser: CurrentUser) {
  if (currentUser.role !== UserRole.OWNER) {
    throw errors.forbidden();
  }

  const parsed = updateTaskSchema.safeParse(input);

  if (!parsed.success) {
    throw errors.validation(firstIssueMessage(parsed.error));
  }

  const existingTask = await prisma.task.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingTask) {
    throw errors.notFound("任务不存在。");
  }

  const data: Prisma.TaskUncheckedUpdateInput = {};

  if (parsed.data.title !== undefined) {
    data.title = parsed.data.title;
  }

  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description;
  }

  if (parsed.data.priority !== undefined) {
    data.priority = parsed.data.priority;
  }

  if (parsed.data.assigneeId !== undefined) {
    data.assigneeId = parsed.data.assigneeId;
  }

  if (parsed.data.milestoneId !== undefined) {
    data.milestoneId = parsed.data.milestoneId;
  }

  const dueDate = parseDateInput(parsed.data.dueDate);
  if (dueDate !== undefined) {
    data.dueDate = dueDate;
  }

  return prisma.task.update({
    where: { id },
    data,
    include: {
      assignee: { select: safeUserSelect },
      milestone: true,
      dependencies: { include: { dependsOnTask: true } },
      tags: { include: { tag: true } },
    },
  });
}

export async function changeTaskStatus(id: string, input: unknown, currentUser: CurrentUser) {
  const parsed = changeTaskStatusSchema.safeParse(input);

  if (!parsed.success) {
    throw errors.validation(firstIssueMessage(parsed.error));
  }

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      dependencies: { include: { dependsOnTask: true } },
    },
  });

  if (!task) {
    throw errors.notFound("任务不存在。");
  }

  const result = canChangeTaskStatus({
    role: currentUser.role as SharedUserRole,
    currentStatus: task.status,
    nextStatus: parsed.data.status,
    isAssignee: task.assigneeId === currentUser.id,
    hasUnfinishedDependencies: task.dependencies.some(
      (dependency) => dependency.dependsOnTask.status !== TaskStatus.DONE,
    ),
    isConfirmedTask: Boolean(task.assigneeId),
  });

  if (!result.ok) {
    if (result.code === "TASK_DEPENDENCY_BLOCKED") {
      throw errors.dependencyBlocked();
    }

    if (result.code === "INVALID_TASK_TRANSITION") {
      throw errors.invalidTransition();
    }

    throw errors.forbidden();
  }

  const isDone = parsed.data.status === TaskStatus.DONE;

  return prisma.task.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewerId: isDone ? currentUser.id : null,
      completedAt: isDone ? new Date() : null,
    },
  });
}
