import type { Context } from "hono";

import { AppError, errors } from "./errors.js";

export function ok<T>(c: Context, data: T) {
  return c.json({ data });
}

export function created<T>(c: Context, data: T) {
  return c.json({ data }, 201);
}

export async function readJson(c: Context) {
  try {
    return await c.req.json();
  } catch {
    throw errors.validation("请求体必须是合法的 JSON。");
  }
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
