import { UserRole } from "@quintask/shared";

import { canWriteComment, canWriteGlobalConfig, canWriteTask } from "../modules/tasks/permissions.js";

describe("task permissions", () => {
  it("prevents TEACHER from writing tasks or comments", () => {
    expect(canWriteTask(UserRole.TEACHER, true)).toBe(false);
    expect(canWriteTask(UserRole.TEACHER, false)).toBe(false);
    expect(canWriteComment(UserRole.TEACHER)).toBe(false);
  });

  it("allows OWNER to write tasks and global config", () => {
    expect(canWriteTask(UserRole.OWNER, false)).toBe(true);
    expect(canWriteTask(UserRole.OWNER, true)).toBe(true);
    expect(canWriteGlobalConfig(UserRole.OWNER)).toBe(true);
  });

  it("allows MEMBER to create suggestions and comments but not write global config", () => {
    expect(canWriteTask(UserRole.MEMBER, true)).toBe(true);
    expect(canWriteTask(UserRole.MEMBER, false)).toBe(false);
    expect(canWriteComment(UserRole.MEMBER)).toBe(true);
    expect(canWriteGlobalConfig(UserRole.MEMBER)).toBe(false);
  });
});
