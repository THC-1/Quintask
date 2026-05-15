import { Prisma } from "@prisma/client";
import { createMilestoneSchema } from "@quintask/shared";
import { Hono } from "hono";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { created, ok, readJson } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";

export const milestoneRoutes = new Hono();

function firstIssueMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "请求参数不正确。";
}

function parseDateInput(value: string | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  return value === null ? null : new Date(value);
}

function requireOwner(role: string) {
  if (role !== "OWNER") {
    throw errors.forbidden();
  }
}

function milestoneProgress(tasks: Array<{ status: string }>) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((task) => task.status === "DONE").length;

  return {
    totalTasks,
    doneTasks,
    progress: totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100),
  };
}

function mapMilestoneWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    throw errors.notFound("里程碑不存在。");
  }

  throw error;
}

milestoneRoutes.use("*", authMiddleware);

milestoneRoutes.get("/", async (c) => {
  const milestones = await prisma.milestone.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }, { id: "asc" }],
    include: { tasks: true },
  });

  return ok(
    c,
    milestones.map((milestone) => ({
      ...milestone,
      ...milestoneProgress(milestone.tasks),
    })),
  );
});

milestoneRoutes.post("/", async (c) => {
  requireOwner(c.get("user").role);

  const parsed = createMilestoneSchema.safeParse(await readJson(c));

  if (!parsed.success) {
    throw errors.validation(firstIssueMessage(parsed.error));
  }

  const project = await prisma.project.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!project) {
    throw errors.notFound("项目不存在。");
  }

  return created(
    c,
    await prisma.milestone.create({
      data: {
        projectId: project.id,
        title: parsed.data.title,
        description: parsed.data.description,
        startDate: parseDateInput(parsed.data.startDate),
        dueDate: parseDateInput(parsed.data.dueDate),
        status: parsed.data.status,
        sortOrder: parsed.data.sortOrder,
      },
    }),
  );
});

milestoneRoutes.patch("/:id", async (c) => {
  requireOwner(c.get("user").role);

  const parsed = createMilestoneSchema.partial().safeParse(await readJson(c));

  if (!parsed.success) {
    throw errors.validation(firstIssueMessage(parsed.error));
  }

  const data: Prisma.MilestoneUpdateInput = {};

  if (parsed.data.title !== undefined) {
    data.title = parsed.data.title;
  }

  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description;
  }

  const startDate = parseDateInput(parsed.data.startDate);
  if (startDate !== undefined) {
    data.startDate = startDate;
  }

  const dueDate = parseDateInput(parsed.data.dueDate);
  if (dueDate !== undefined) {
    data.dueDate = dueDate;
  }

  if (parsed.data.status !== undefined) {
    data.status = parsed.data.status;
  }

  if (parsed.data.sortOrder !== undefined) {
    data.sortOrder = parsed.data.sortOrder;
  }

  try {
    return ok(
      c,
      await prisma.milestone.update({
        where: { id: c.req.param("id") },
        data,
      }),
    );
  } catch (error) {
    mapMilestoneWriteError(error);
  }
});
