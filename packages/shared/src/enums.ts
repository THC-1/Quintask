export const UserRole = {
  OWNER: "OWNER",
  MEMBER: "MEMBER",
  TEACHER: "TEACHER"
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  IN_REVIEW: "IN_REVIEW",
  DONE: "DONE"
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH"
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const MilestoneStatus = {
  PLANNED: "PLANNED",
  ACTIVE: "ACTIVE",
  DONE: "DONE"
} as const;

export type MilestoneStatus = (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export const CommentType = {
  COMMENT: "COMMENT",
  PROGRESS: "PROGRESS",
  REVIEW: "REVIEW"
} as const;

export type CommentType = (typeof CommentType)[keyof typeof CommentType];
