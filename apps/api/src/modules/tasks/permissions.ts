import { UserRole, type UserRole as UserRoleType } from "@quintask/shared";

export function canWriteGlobalConfig(role: UserRoleType): boolean {
  return role === UserRole.OWNER;
}

export function canWriteTask(role: UserRoleType, isCreatingSuggestion: boolean): boolean {
  if (role === UserRole.OWNER) {
    return true;
  }

  return role === UserRole.MEMBER && isCreatingSuggestion;
}

export function canWriteComment(role: UserRoleType): boolean {
  return role === UserRole.OWNER || role === UserRole.MEMBER;
}
