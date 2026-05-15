import type { UserRole } from "@prisma/client";
import { createMiddleware } from "hono/factory";

import { errors } from "../lib/errors.js";

export function requireRole(...roles: UserRole[]) {
  return createMiddleware(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      throw errors.unauthorized();
    }

    if (!roles.includes(user.role)) {
      throw errors.forbidden();
    }

    await next();
  });
}
