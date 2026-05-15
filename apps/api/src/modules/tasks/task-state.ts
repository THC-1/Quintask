import { TaskStatus, UserRole, type TaskStatus as TaskStatusType, type UserRole as UserRoleType } from "@quintask/shared";

type TaskStateChangeInput = {
  role: UserRoleType;
  currentStatus: TaskStatusType;
  nextStatus: TaskStatusType;
  isAssignee: boolean;
  hasUnfinishedDependencies: boolean;
  isConfirmedTask: boolean;
};

type TaskStateChangeResult =
  | { ok: true }
  | {
      ok: false;
      code: "FORBIDDEN" | "TASK_DEPENDENCY_BLOCKED" | "INVALID_TASK_TRANSITION";
    };

export function canChangeTaskStatus(input: TaskStateChangeInput): TaskStateChangeResult {
  if (input.role === UserRole.TEACHER) {
    return { ok: false, code: "FORBIDDEN" };
  }

  if (
    input.hasUnfinishedDependencies &&
    (input.nextStatus === TaskStatus.IN_REVIEW || input.nextStatus === TaskStatus.DONE)
  ) {
    return { ok: false, code: "TASK_DEPENDENCY_BLOCKED" };
  }

  if (input.role === UserRole.OWNER) {
    return { ok: true };
  }

  if (!input.isAssignee || !input.isConfirmedTask) {
    return { ok: false, code: "FORBIDDEN" };
  }

  if (
    (input.currentStatus === TaskStatus.TODO && input.nextStatus === TaskStatus.IN_PROGRESS) ||
    (input.currentStatus === TaskStatus.IN_PROGRESS && input.nextStatus === TaskStatus.IN_REVIEW)
  ) {
    return { ok: true };
  }

  return { ok: false, code: "FORBIDDEN" };
}
