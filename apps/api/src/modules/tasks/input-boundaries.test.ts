import { TaskPriority, UserRole } from "@quintask/shared";

import {
  getUnsupportedTaskUpdateFields,
  normalizeCreateTaskRelations,
  normalizeCreateTaskScalars,
} from "./input-boundaries.js";

describe("task input boundaries", () => {
  it("detects accepted task update fields that require dedicated APIs", () => {
    expect(
      getUnsupportedTaskUpdateFields({
        title: "Rename",
        status: "DONE",
        tagIds: ["tag-1"],
        dependencyIds: ["task-1"],
      }),
    ).toEqual(["status", "tagIds", "dependencyIds"]);
  });

  it("deduplicates owner task relation ids on create", () => {
    expect(
      normalizeCreateTaskRelations({
        role: UserRole.OWNER,
        tagIds: ["tag-1", "tag-1", "tag-2"],
        dependencyIds: ["task-1", "task-1", "task-2"],
      }),
    ).toEqual({
      tagIds: ["tag-1", "tag-2"],
      dependencyIds: ["task-1", "task-2"],
    });
  });

  it("keeps member-created suggestions structurally light", () => {
    expect(
      normalizeCreateTaskScalars({
        role: UserRole.MEMBER,
        priority: TaskPriority.HIGH,
        assigneeId: "user-1",
        milestoneId: "milestone-1",
        dueDate: "2026-05-16T00:00:00.000Z",
      }),
    ).toEqual({
      priority: TaskPriority.MEDIUM,
      assigneeId: null,
      milestoneId: null,
      dueDate: null,
    });

    expect(
      normalizeCreateTaskRelations({
        role: UserRole.MEMBER,
        tagIds: ["tag-1"],
        dependencyIds: ["task-1"],
      }),
    ).toEqual({ tagIds: [], dependencyIds: [] });
  });
});
