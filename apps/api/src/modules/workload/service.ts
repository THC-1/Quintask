import type { User } from "@prisma/client";
import { TaskPriority, TaskStatus, UserRole, type TaskPriority as SharedTaskPriority, type TaskStatus as SharedTaskStatus } from "@quintask/shared";

import { prisma } from "../../db.js";

export type WorkloadTask = {
  assigneeId: string | null;
  status: SharedTaskStatus;
  priority: SharedTaskPriority;
  dependencies?: Array<{
    dependsOnTask: {
      status: SharedTaskStatus;
    };
  }>;
};

export type WorkloadSummary = {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  blocked: number;
  high: number;
  medium: number;
  low: number;
};

const emptySummary = (): WorkloadSummary => ({
  total: 0,
  todo: 0,
  inProgress: 0,
  inReview: 0,
  done: 0,
  blocked: 0,
  high: 0,
  medium: 0,
  low: 0,
});

export function summarizeMemberWorkload(tasks: WorkloadTask[]) {
  const summaries = new Map<string, WorkloadSummary>();

  for (const task of tasks) {
    if (!task.assigneeId) {
      continue;
    }

    const summary = summaries.get(task.assigneeId) ?? emptySummary();
    summary.total += 1;

    if (task.status === TaskStatus.TODO) {
      summary.todo += 1;
    } else if (task.status === TaskStatus.IN_PROGRESS) {
      summary.inProgress += 1;
    } else if (task.status === TaskStatus.IN_REVIEW) {
      summary.inReview += 1;
    } else if (task.status === TaskStatus.DONE) {
      summary.done += 1;
    }

    if (task.priority === TaskPriority.HIGH) {
      summary.high += 1;
    } else if (task.priority === TaskPriority.MEDIUM) {
      summary.medium += 1;
    } else if (task.priority === TaskPriority.LOW) {
      summary.low += 1;
    }

    const hasUnfinishedDependencies = task.dependencies?.some(
      (dependency) => dependency.dependsOnTask.status !== TaskStatus.DONE,
    );

    if (task.status !== TaskStatus.DONE && hasUnfinishedDependencies) {
      summary.blocked += 1;
    }

    summaries.set(task.assigneeId, summary);
  }

  return summaries;
}

const safeUserSelect = {
  id: true,
  name: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

type WorkloadUser = Pick<User, "id" | "name" | "username" | "role" | "isActive" | "createdAt">;

export async function getWorkload() {
  const users = await prisma.user.findMany({
    where: { role: UserRole.MEMBER, isActive: true },
    orderBy: { createdAt: "asc" },
    select: safeUserSelect,
  });

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: { in: users.map((user) => user.id) },
    },
    orderBy: { createdAt: "desc" },
    include: {
      milestone: true,
      comments: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      dependencies: {
        include: {
          dependsOnTask: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      },
    },
  });

  const summaries = summarizeMemberWorkload(tasks);
  const tasksByUser = new Map<string, typeof tasks>();

  for (const task of tasks) {
    if (!task.assigneeId) {
      continue;
    }

    const userTasks = tasksByUser.get(task.assigneeId) ?? [];
    userTasks.push(task);
    tasksByUser.set(task.assigneeId, userTasks);
  }

  return users.map((user: WorkloadUser) => ({
    user,
    summary: summaries.get(user.id) ?? emptySummary(),
    tasks: tasksByUser.get(user.id) ?? [],
  }));
}
