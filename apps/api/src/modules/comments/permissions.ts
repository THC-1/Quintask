import {
  CommentType,
  UserRole,
  type CommentType as CommentTypeType,
  type UserRole as UserRoleType,
} from "@quintask/shared";

export function canCreateCommentType(role: UserRoleType, type: CommentTypeType) {
  if (role === UserRole.TEACHER) {
    return false;
  }

  if (role === UserRole.MEMBER && type === CommentType.REVIEW) {
    return false;
  }

  return true;
}
