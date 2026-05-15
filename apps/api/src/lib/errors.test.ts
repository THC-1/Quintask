import { errors } from "./errors.js";

describe("api errors", () => {
  it("preserves task state result codes in API responses", () => {
    expect(errors.dependencyBlocked().code).toBe("TASK_DEPENDENCY_BLOCKED");
    expect(errors.invalidTransition().code).toBe("INVALID_TASK_TRANSITION");
  });
});
