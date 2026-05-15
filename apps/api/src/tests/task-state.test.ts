import { TaskStatus, UserRole } from "@quintask/shared";

import { canChangeTaskStatus } from "../modules/tasks/task-state.js";

describe("canChangeTaskStatus", () => {
  it("allows OWNER to approve IN_REVIEW to DONE", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.OWNER,
        currentStatus: TaskStatus.IN_REVIEW,
        nextStatus: TaskStatus.DONE,
        isAssignee: false,
        hasUnfinishedDependencies: false,
        isConfirmedTask: false,
      }),
    ).toEqual({ ok: true });
  });

  it("prevents MEMBER from directly setting DONE", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.MEMBER,
        currentStatus: TaskStatus.TODO,
        nextStatus: TaskStatus.DONE,
        isAssignee: true,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true,
      }),
    ).toEqual({ ok: false, code: "INVALID_TASK_TRANSITION" });
  });

  it("blocks submitting to IN_REVIEW when dependencies are unfinished", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.OWNER,
        currentStatus: TaskStatus.IN_PROGRESS,
        nextStatus: TaskStatus.IN_REVIEW,
        isAssignee: false,
        hasUnfinishedDependencies: true,
        isConfirmedTask: true,
      }),
    ).toEqual({ ok: false, code: "TASK_DEPENDENCY_BLOCKED" });
  });

  it("prevents MEMBER from moving an unconfirmed suggestion to IN_PROGRESS", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.MEMBER,
        currentStatus: TaskStatus.TODO,
        nextStatus: TaskStatus.IN_PROGRESS,
        isAssignee: true,
        hasUnfinishedDependencies: false,
        isConfirmedTask: false,
      }),
    ).toEqual({ ok: false, code: "FORBIDDEN" });
  });

  it("prevents TEACHER from changing status", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.TEACHER,
        currentStatus: TaskStatus.TODO,
        nextStatus: TaskStatus.IN_PROGRESS,
        isAssignee: true,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true,
      }),
    ).toEqual({ ok: false, code: "FORBIDDEN" });
  });

  it("allows MEMBER assignee to move confirmed TODO to IN_PROGRESS", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.MEMBER,
        currentStatus: TaskStatus.TODO,
        nextStatus: TaskStatus.IN_PROGRESS,
        isAssignee: true,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true,
      }),
    ).toEqual({ ok: true });
  });
});
