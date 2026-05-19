# Owner Task Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let owners fully edit task fields, tags, and dependencies from the task detail page while leaving member and teacher permissions unchanged.

**Architecture:** Keep the existing `PATCH /api/tasks/:id` endpoint as the single owner-only task edit API. Extend task update relation handling in the backend, then add a minimal owner-only edit mode inside `TaskDetailView` backed by Pinia store calls and existing option APIs.

**Tech Stack:** TypeScript, Hono, Prisma, Zod, Vitest, Vue 3, Pinia, Vue Router.

---

## File Structure

- Modify `apps/api/src/modules/tasks/input-boundaries.ts` to allow relation ids on task updates and expose relation normalization/self-dependency helpers.
- Modify `apps/api/src/modules/tasks/input-boundaries.test.ts` with RED tests for update field filtering and dependency normalization.
- Modify `apps/api/src/modules/tasks/service.ts` to validate and replace task tags/dependencies during owner updates.
- Modify `apps/web/src/stores/tasks.ts` to define `UpdateTaskInput` and call `PATCH /tasks/:id`.
- Modify `apps/web/src/views/TaskDetailView.vue` to add owner-only edit mode and supporting option loading.

---

### Task 1: Backend Update Input Boundaries

**Files:**
- Modify: `apps/api/src/modules/tasks/input-boundaries.test.ts`
- Modify: `apps/api/src/modules/tasks/input-boundaries.ts`

- [ ] **Step 1: Write failing input-boundary tests**

Add expectations that `tagIds` and `dependencyIds` are now supported on task update, while `status` remains unsupported:

```ts
expect(
  getUnsupportedTaskUpdateFields({
    title: "Rename",
    status: "DONE",
    tagIds: ["tag-1"],
    dependencyIds: ["task-1"],
  }),
).toEqual(["status"]);
```

Add tests for deduplicating owner update relation ids and rejecting self-dependency through a pure helper.

- [ ] **Step 2: Run RED test**

Run: `npm run test -w @quintask/api -- input-boundaries`

Expected: FAIL because update relation ids are still reported unsupported and the new helper does not exist.

- [ ] **Step 3: Implement minimal helpers**

Update `unsupportedTaskUpdateFields` to only include `status`. Add `normalizeUpdateTaskRelations({ taskId, tagIds, dependencyIds })` that returns undefined for omitted relation arrays, deduplicates provided arrays, and throws a validation error marker or returns a self-dependency result the service can convert.

- [ ] **Step 4: Run GREEN test**

Run: `npm run test -w @quintask/api -- input-boundaries`

Expected: PASS.

---

### Task 2: Backend Task Update Persistence

**Files:**
- Modify: `apps/api/src/modules/tasks/service.ts`
- Test: existing API/unit test coverage plus `npm run test -w @quintask/api`

- [ ] **Step 1: Write or extend failing backend behavior tests**

Use available task service/input tests to prove:

```ts
expect(() =>
  normalizeUpdateTaskRelations({
    taskId: "task-1",
    tagIds: [],
    dependencyIds: ["task-1"],
  }),
).toThrow("任务不能依赖自身。");
```

If route-level database tests are not practical in this repo, cover the pure boundary behavior and validate TypeScript build for persistence wiring.

- [ ] **Step 2: Run RED test**

Run: `npm run test -w @quintask/api -- input-boundaries`

Expected: FAIL until the self-dependency behavior exists.

- [ ] **Step 3: Implement relation replacement**

In `updateTask`, keep owner-only permission. Validate provided `tagIds` and `dependencyIds`. When present, use Prisma nested writes:

```ts
tags: {
  deleteMany: {},
  create: tagIds.map((tagId) => ({ tagId })),
},
dependencies: {
  deleteMany: {},
  create: dependencyIds.map((dependsOnTaskId) => ({ dependsOnTaskId })),
},
```

Status remains rejected by `getUnsupportedTaskUpdateFields`.

- [ ] **Step 4: Verify backend**

Run: `npm run test -w @quintask/api`

Expected: PASS.

Run: `npm run typecheck -w @quintask/api`

Expected: PASS.

---

### Task 3: Frontend Store Update API

**Files:**
- Modify: `apps/web/src/stores/tasks.ts`

- [ ] **Step 1: Add store update type and action**

Add `UpdateTaskInput` with optional fields:

```ts
export type UpdateTaskInput = {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  milestoneId?: string | null;
  dueDate?: string | null;
  tagIds?: string[];
  dependencyIds?: string[];
};
```

Add `updateTask(id, input)` that sends `PATCH /tasks/:id` and reloads current detail or list.

- [ ] **Step 2: Verify store typing**

Run: `npm run typecheck -w @quintask/web`

Expected: may fail until `TaskDetailView` uses the new type correctly; no production code outside the store should be changed in this task.

---

### Task 4: Owner Edit Form in Task Detail

**Files:**
- Modify: `apps/web/src/views/TaskDetailView.vue`

- [ ] **Step 1: Add owner-only edit state**

Add refs for edit mode, save loading, edit errors, option lists, and a form object. Prefill from the current task when opening edit mode.

- [ ] **Step 2: Load owner-only options**

When the current user is owner and edit mode opens, load:

```ts
apiFetch<AssignableUser[]>("/users")
apiFetch<MilestoneOption[]>("/milestones")
apiFetch<TagOption[]>("/tags")
tasksStore.loadTasks()
```

Keep option types local to the view.

- [ ] **Step 3: Render the form**

Replace the read-only main/detail sections with a form while editing. Use existing classes where possible and add only small class names if needed. Use checkboxes for tags and dependencies to avoid adding new UI dependencies.

- [ ] **Step 4: Save and cancel behavior**

On save, trim title/description, convert empty relation ids to `null`, submit selected tag/dependency ids, reload the task, and close edit mode. On cancel, close edit mode and reset local errors.

- [ ] **Step 5: Verify frontend**

Run: `npm run typecheck -w @quintask/web`

Expected: PASS.

---

### Task 5: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run full test suite**

Run: `npm test`

Expected: PASS, with shared/web smoke test messages allowed.

- [ ] **Step 2: Run full type/lint check**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 3: Review diff**

Run: `git diff --stat`

Expected: changes limited to the spec/plan and task-edit implementation files.
