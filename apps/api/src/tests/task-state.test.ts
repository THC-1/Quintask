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

  it("prevents OWNER from moving TODO directly to DONE", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.OWNER,
        currentStatus: TaskStatus.TODO,
        nextStatus: TaskStatus.DONE,
        isAssignee: false,
        hasUnfinishedDependencies: false,
        isConfirmedTask: false,
      }),
    ).toEqual({ ok: false, code: "INVALID_TASK_TRANSITION" });
  });

  it("prevents OWNER from moving IN_PROGRESS directly to DONE", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.OWNER,
        currentStatus: TaskStatus.IN_PROGRESS,
        nextStatus: TaskStatus.DONE,
        isAssignee: false,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true,
      }),
    ).toEqual({ ok: false, code: "INVALID_TASK_TRANSITION" });
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
    ).toEqual({ ok: false, code: "FORBIDDEN" });
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

  it("blocks setting DONE when dependencies are unfinished", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.OWNER,
        currentStatus: TaskStatus.IN_REVIEW,
        nextStatus: TaskStatus.DONE,
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

  it("allows MEMBER assignee to move confirmed IN_PROGRESS to IN_REVIEW", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.MEMBER,
        currentStatus: TaskStatus.IN_PROGRESS,
        nextStatus: TaskStatus.IN_REVIEW,
        isAssignee: true,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true,
      }),
    ).toEqual({ ok: true });
  });

  it("prevents MEMBER who is not the assignee from changing status", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.MEMBER,
        currentStatus: TaskStatus.TODO,
        nextStatus: TaskStatus.IN_PROGRESS,
        isAssignee: false,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true,
      }),
    ).toEqual({ ok: false, code: "FORBIDDEN" });
  });

  it("allows OWNER to move IN_REVIEW back to IN_PROGRESS", () => {
    expect(
      canChangeTaskStatus({
        role: UserRole.OWNER,
        currentStatus: TaskStatus.IN_REVIEW,
        nextStatus: TaskStatus.IN_PROGRESS,
        isAssignee: false,
        hasUnfinishedDependencies: false,
        isConfirmedTask: true,
      }),
    ).toEqual({ ok: true });
  });
});
