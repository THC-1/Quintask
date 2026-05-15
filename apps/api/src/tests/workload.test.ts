import { TaskPriority, TaskStatus } from "@quintask/shared";

import { summarizeMemberWorkload } from "../modules/workload/service.js";

describe("summarizeMemberWorkload", () => {
  it("groups assigned tasks by member and counts status, priority, and blocked tasks", () => {
    const summaries = summarizeMemberWorkload([
      {
        assigneeId: "u1",
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dependencies: [],
      },
      {
        assigneeId: "u1",
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dependencies: [{ dependsOnTask: { status: TaskStatus.IN_PROGRESS } }],
      },
      {
        assigneeId: "u2",
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dependencies: [],
      },
      {
        assigneeId: null,
        status: TaskStatus.IN_REVIEW,
        priority: TaskPriority.HIGH,
        dependencies: [],
      },
    ]);

    expect(summaries.get("u1")).toEqual({
      total: 2,
      todo: 1,
      inProgress: 1,
      inReview: 0,
      done: 0,
      blocked: 1,
      high: 1,
      medium: 1,
      low: 0,
    });

    expect(summaries.get("u2")).toEqual({
      total: 1,
      todo: 0,
      inProgress: 0,
      inReview: 0,
      done: 1,
      blocked: 0,
      high: 0,
      medium: 0,
      low: 1,
    });

    expect(summaries.has("u3")).toBe(false);
  });
});
