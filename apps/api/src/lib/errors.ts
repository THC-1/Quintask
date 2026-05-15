import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const errors = {
  unauthorized: (message = "请先登录") => new AppError("UNAUTHORIZED", 401, message),
  forbidden: (message = "没有权限执行此操作") => new AppError("FORBIDDEN", 403, message),
  notFound: (message = "资源不存在") => new AppError("NOT_FOUND", 404, message),
  validation: (message = "请求参数不正确") => new AppError("VALIDATION_ERROR", 400, message),
  invalidTransition: (message = "任务状态流转不合法") =>
    new AppError("INVALID_TASK_TRANSITION", 400, message),
  dependencyBlocked: (message = "依赖任务尚未完成") =>
    new AppError("TASK_DEPENDENCY_BLOCKED", 409, message),
};
