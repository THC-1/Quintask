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
import {
  getUnsupportedTaskUpdateFields,
  hasSelfDependency,
  normalizeCreateTaskRelations,
  normalizeCreateTaskScalars,
  normalizeUpdateTaskRelations,
} from "./input-boundaries.js";
import { canDeleteTask } from "./permissions.js";
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

async function validateTaskRelations(input: {
  assigneeId?: string | null;
  milestoneId?: string | null;
  tagIds?: string[];
  dependencyIds?: string[];
}) {
  if (input.assigneeId !== undefined && input.assigneeId !== null) {
    const assignee = await prisma.user.findFirst({
      where: { id: input.assigneeId, isActive: true },
      select: { id: true },
    });

    if (!assignee) {
      throw errors.validation("执行人不存在。");
    }
  }

  if (input.milestoneId !== undefined && input.milestoneId !== null) {
    const milestone = await prisma.milestone.findUnique({
      where: { id: input.milestoneId },
      select: { id: true },
    });

    if (!milestone) {
      throw errors.validation("里程碑不存在。");
    }
  }

  if (input.tagIds?.length) {
    const tags = await prisma.tag.findMany({
      where: { id: { in: input.tagIds } },
      select: { id: true },
    });

    if (tags.length !== input.tagIds.length) {
      throw errors.validation("标签不存在。");
    }
  }

  if (input.dependencyIds?.length) {
    const dependencies = await prisma.task.findMany({
      where: { id: { in: input.dependencyIds } },
      select: { id: true },
    });

    if (dependencies.length !== input.dependencyIds.length) {
      throw errors.validation("依赖任务不存在。");
    }
  }
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

  const scalars = normalizeCreateTaskScalars({
    role: currentUser.role,
    priority: parsed.data.priority,
    assigneeId: parsed.data.assigneeId,
    milestoneId: parsed.data.milestoneId,
    dueDate: parsed.data.dueDate,
  });
  const relations = normalizeCreateTaskRelations({
    role: currentUser.role,
    tagIds: parsed.data.tagIds,
    dependencyIds: parsed.data.dependencyIds,
  });

  if (currentUser.role === UserRole.OWNER) {
    await validateTaskRelations({
      assigneeId: scalars.assigneeId,
      milestoneId: scalars.milestoneId,
      tagIds: relations.tagIds,
      dependencyIds: relations.dependencyIds,
    });
  }

  return prisma.task.create({
    data: {
      projectId: project.id,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: scalars.priority,
      creatorId: currentUser.id,
      assigneeId: scalars.assigneeId,
      milestoneId: scalars.milestoneId,
      dueDate: parseDateInput(scalars.dueDate),
      tags: {
        create: relations.tagIds.map((tagId) => ({ tagId })),
      },
      dependencies: {
        create: relations.dependencyIds.map((dependsOnTaskId) => ({ dependsOnTaskId })),
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

  if (typeof input === "object" && input !== null && getUnsupportedTaskUpdateFields(input).length > 0) {
    throw errors.validation("请使用对应接口修改任务状态、标签或依赖关系。");
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

  const relations = normalizeUpdateTaskRelations({
    tagIds: parsed.data.tagIds,
    dependencyIds: parsed.data.dependencyIds,
  });

  if (hasSelfDependency(id, relations.dependencyIds)) {
    throw errors.validation("任务不能依赖自身。");
  }

  await validateTaskRelations({
    assigneeId: parsed.data.assigneeId,
    milestoneId: parsed.data.milestoneId,
    tagIds: relations.tagIds,
    dependencyIds: relations.dependencyIds,
  });

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

  return prisma.$transaction(async (tx) => {
    await tx.task.update({
      where: { id },
      data,
    });

    if (relations.tagIds !== undefined) {
      await tx.taskTag.deleteMany({ where: { taskId: id } });

      if (relations.tagIds.length > 0) {
        await tx.taskTag.createMany({
          data: relations.tagIds.map((tagId) => ({ taskId: id, tagId })),
        });
      }
    }

    if (relations.dependencyIds !== undefined) {
      await tx.taskDependency.deleteMany({ where: { taskId: id } });

      if (relations.dependencyIds.length > 0) {
        await tx.taskDependency.createMany({
          data: relations.dependencyIds.map((dependsOnTaskId) => ({ taskId: id, dependsOnTaskId })),
        });
      }
    }

    return tx.task.findUnique({
      where: { id },
      include: {
        assignee: { select: safeUserSelect },
        milestone: true,
        dependencies: { include: { dependsOnTask: true } },
        tags: { include: { tag: true } },
      },
    });
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

export async function deleteTask(id: string, currentUser: CurrentUser) {
  if (!canDeleteTask(currentUser.role)) {
    throw errors.forbidden();
  }

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!task) {
    throw errors.notFound("任务不存在。");
  }

  await prisma.task.delete({
    where: { id },
  });

  return { id };
}
