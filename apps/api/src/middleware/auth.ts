import { createMiddleware } from "hono/factory";

import { prisma } from "../db.js";
import { errors } from "../lib/errors.js";
import { verifyToken } from "../lib/token.js";

export const authMiddleware = createMiddleware(async (c, next) => {
  const authorization = c.req.header("Authorization");
  const [scheme, token] = authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    throw errors.unauthorized();
  }

  let payload: ReturnType<typeof verifyToken>;

  try {
    payload = verifyToken(token);
  } catch {
    throw errors.unauthorized("登录已失效，请重新登录");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });

  if (!user?.isActive) {
    throw errors.unauthorized("账号已停用或不存在");
  }

  c.set("user", user);
  await next();
});
