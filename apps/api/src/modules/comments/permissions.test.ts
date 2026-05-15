import { CommentType, UserRole } from "@quintask/shared";

import { canCreateCommentType } from "./permissions.js";

describe("canCreateCommentType", () => {
  it("allows OWNER to create all comment types", () => {
    expect(canCreateCommentType(UserRole.OWNER, CommentType.REVIEW)).toBe(true);
    expect(canCreateCommentType(UserRole.OWNER, CommentType.COMMENT)).toBe(true);
    expect(canCreateCommentType(UserRole.OWNER, CommentType.PROGRESS)).toBe(true);
  });

  it("allows MEMBER comments and progress but rejects review", () => {
    expect(canCreateCommentType(UserRole.MEMBER, CommentType.COMMENT)).toBe(true);
    expect(canCreateCommentType(UserRole.MEMBER, CommentType.PROGRESS)).toBe(true);
    expect(canCreateCommentType(UserRole.MEMBER, CommentType.REVIEW)).toBe(false);
  });

  it("prevents TEACHER writes", () => {
    expect(canCreateCommentType(UserRole.TEACHER, CommentType.COMMENT)).toBe(false);
  });
});
