import { UserRole, type UserRole as UserRoleType } from "@quintask/shared";

const memberRestrictedSubtaskUpdateFields = ["title", "assigneeId", "sortOrder"] as const;

export function canWriteSubtask(
  role: UserRoleType,
  userId: string,
  taskAssigneeId: string | null,
): boolean {
  if (role === UserRole.OWNER) {
    return true;
  }

  return role === UserRole.MEMBER && taskAssigneeId === userId;
}

export function getUnsupportedMemberSubtaskUpdateFields(input: object) {
  return memberRestrictedSubtaskUpdateFields.filter((field) => Object.hasOwn(input, field));
}
