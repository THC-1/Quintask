import { UserRole, type UserRole as UserRoleType } from "@quintask/shared";

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
