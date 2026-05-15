import { Prisma, UserRole } from "@prisma/client";
import { createUserSchema, updateUserSchema } from "@quintask/shared";
import { Hono } from "hono";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { created, ok, readJson } from "../../lib/http.js";
import { hashPassword } from "../../lib/password.js";
import { authMiddleware } from "../../middleware/auth.js";

export const userRoutes = new Hono();

const safeUserSelect = {
  id: true,
  name: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

function firstIssueMessage(error: { issues: Array<{ message: string }> }) {
  return error.issues[0]?.message ?? "请求参数不正确。";
}

function requireOwner(role: UserRole) {
  if (role !== UserRole.OWNER) {
    throw errors.forbidden();
  }
}

function mapUserWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw errors.validation("账号已存在。");
  }

  throw error;
}

userRoutes.use("*", authMiddleware);

userRoutes.get("/", async (c) => {
  return ok(
    c,
    await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: safeUserSelect,
    }),
  );
});

userRoutes.post("/", async (c) => {
  requireOwner(c.get("user").role);

  const parsed = createUserSchema.safeParse(await readJson(c));

  if (!parsed.success) {
    throw errors.validation(firstIssueMessage(parsed.error));
  }

  try {
    return created(
      c,
      await prisma.user.create({
        data: {
          name: parsed.data.name,
          username: parsed.data.username,
          passwordHash: await hashPassword(parsed.data.password),
          role: parsed.data.role,
        },
        select: safeUserSelect,
      }),
    );
  } catch (error) {
    mapUserWriteError(error);
  }
});

userRoutes.patch("/:id", async (c) => {
  requireOwner(c.get("user").role);

  const parsed = updateUserSchema.safeParse(await readJson(c));

  if (!parsed.success) {
    throw errors.validation(firstIssueMessage(parsed.error));
  }

  const data: Prisma.UserUpdateInput = {};

  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name;
  }

  if (parsed.data.isActive !== undefined) {
    data.isActive = parsed.data.isActive;
  }

  if (parsed.data.password !== undefined) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  try {
    return ok(
      c,
      await prisma.user.update({
        where: { id: c.req.param("id") },
        data,
        select: safeUserSelect,
      }),
    );
  } catch (error) {
    mapUserWriteError(error);
  }
});
