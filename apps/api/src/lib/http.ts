import type { Context } from "hono";

import { AppError } from "./errors.js";

export function ok<T>(c: Context, data: T) {
  return c.json({ data });
}

export function created<T>(c: Context, data: T) {
  return c.json({ data }, 201);
}

export function handleError(error: Error, c: Context) {
  if (error instanceof AppError) {
    return c.json(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
  }

  console.error(error);

  return c.json(
    { error: { code: "INTERNAL_ERROR", message: "服务器内部错误" } },
    500,
  );
}
