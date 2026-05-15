import { TaskPriority, UserRole, type TaskPriority as TaskPriorityType } from "@quintask/shared";

type TaskCreateScalarInput = {
  role: string;
  priority: TaskPriorityType;
  assigneeId?: string | null;
  milestoneId?: string | null;
  dueDate?: string | null;
};

type TaskCreateRelationInput = {
  role: string;
  tagIds: string[];
  dependencyIds: string[];
};

const unsupportedTaskUpdateFields = ["status", "tagIds", "dependencyIds"] as const;

export function getUnsupportedTaskUpdateFields(input: object) {
  return unsupportedTaskUpdateFields.filter((field) => Object.hasOwn(input, field));
}

export function normalizeCreateTaskScalars(input: TaskCreateScalarInput) {
  if (input.role !== UserRole.OWNER) {
    return {
      priority: TaskPriority.MEDIUM,
      assigneeId: null,
      milestoneId: null,
      dueDate: null,
    };
  }

  return {
    priority: input.priority,
    assigneeId: input.assigneeId ?? null,
    milestoneId: input.milestoneId ?? null,
    dueDate: input.dueDate ?? null,
  };
}

export function normalizeCreateTaskRelations(input: TaskCreateRelationInput) {
  if (input.role !== UserRole.OWNER) {
    return {
      tagIds: [],
      dependencyIds: [],
    };
  }

  return {
    tagIds: [...new Set(input.tagIds)],
    dependencyIds: [...new Set(input.dependencyIds)],
  };
}
