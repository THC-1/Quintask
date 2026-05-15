import { z } from "zod";
import { CommentType, MilestoneStatus, TaskPriority, TaskStatus, UserRole } from "./enums";

export const loginSchema = z.object({
  username: z.string().min(1, "请输入用户名"),
  password: z.string().min(1, "请输入密码")
});

export const createUserSchema = z.object({
  name: z.string().min(1, "请输入姓名"),
  username: z.string().min(3, "用户名至少需要 3 个字符"),
  password: z.string().min(6, "密码至少需要 6 个字符"),
  role: z.enum([UserRole.MEMBER, UserRole.TEACHER]).default(UserRole.MEMBER)
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "请输入姓名").optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, "密码至少需要 6 个字符").optional()
});

export const createMilestoneSchema = z.object({
  title: z.string().min(1, "请输入里程碑标题"),
  description: z.string().default(""),
  startDate: z.string().datetime().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  status: z.nativeEnum(MilestoneStatus).default(MilestoneStatus.PLANNED),
  sortOrder: z.number().int().min(0).default(0)
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "请输入任务标题"),
  description: z.string().default(""),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  assigneeId: z.string().nullable().optional(),
  milestoneId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  tagIds: z.array(z.string()).default([]),
  dependencyIds: z.array(z.string()).default([])
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.nativeEnum(TaskStatus).optional()
});

export const changeTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus)
});

export const createSubtaskSchema = z.object({
  title: z.string().min(1, "请输入子任务标题"),
  assigneeId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0)
});

export const updateSubtaskSchema = z.object({
  title: z.string().min(1, "请输入子任务标题").optional(),
  isDone: z.boolean().optional(),
  assigneeId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional()
});

export const createCommentSchema = z.object({
  content: z.string().min(1, "请输入评论内容"),
  type: z.nativeEnum(CommentType).default(CommentType.COMMENT)
});

export const createTagSchema = z.object({
  name: z.string().min(1, "请输入标签名称"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#64748b")
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
