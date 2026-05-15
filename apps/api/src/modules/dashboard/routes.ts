import { MilestoneStatus, TaskStatus } from "@quintask/shared";
import { Hono } from "hono";

import { prisma } from "../../db.js";
import { ok } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";

export const dashboardRoutes = new Hono();

dashboardRoutes.use("*", authMiddleware);

dashboardRoutes.get("/", async (c) => {
  const [totalTasks, doneTasks, pendingReviewTasks, currentMilestone, recentComments] =
    await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: TaskStatus.DONE } }),
      prisma.task.count({ where: { status: TaskStatus.IN_REVIEW } }),
      prisma.milestone.findFirst({
        where: { status: MilestoneStatus.ACTIVE },
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }, { id: "asc" }],
      }),
      prisma.taskComment.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
          task: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return ok(c, {
    totalTasks,
    doneTasks,
    progress: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100),
    pendingReviewTasks,
    currentMilestone,
    recentComments,
  });
});
