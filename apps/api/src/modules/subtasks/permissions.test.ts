import { UserRole } from "@quintask/shared";

import { canWriteSubtask } from "./permissions.js";

describe("subtask permissions", () => {
  it("allows owners to write any subtask", () => {
    expect(canWriteSubtask(UserRole.OWNER, "owner-1", null)).toBe(true);
    expect(canWriteSubtask(UserRole.OWNER, "owner-1", "member-1")).toBe(true);
  });

  it("allows members to write subtasks only on tasks assigned to themselves", () => {
    expect(canWriteSubtask(UserRole.MEMBER, "member-1", "member-1")).toBe(true);
    expect(canWriteSubtask(UserRole.MEMBER, "member-1", "member-2")).toBe(false);
    expect(canWriteSubtask(UserRole.MEMBER, "member-1", null)).toBe(false);
  });

  it("prevents teachers from writing subtasks", () => {
    expect(canWriteSubtask(UserRole.TEACHER, "teacher-1", "teacher-1")).toBe(false);
  });
});
