import { loginSchema } from "@quintask/shared";

import { prisma } from "../../db.js";
import { errors } from "../../lib/errors.js";
import { verifyPassword } from "../../lib/password.js";
import { signToken } from "../../lib/token.js";

export async function login(input: unknown) {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    throw errors.validation(parsed.error.issues[0]?.message ?? "请求参数不正确");
  }

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  if (!user?.isActive) {
    throw errors.unauthorized("账号或密码错误");
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!passwordValid) {
    throw errors.unauthorized("账号或密码错误");
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };

  return {
    token: signToken({ userId: user.id, role: user.role }),
    user: safeUser,
  };
}
