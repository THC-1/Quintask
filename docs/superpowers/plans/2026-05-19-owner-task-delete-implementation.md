# Owner Task Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add owner-only task deletion from task cards.

**Architecture:** Add a narrow `DELETE /api/tasks/:id` endpoint guarded by owner permissions. Expose a Pinia delete action, then pass owner-only delete controls from board/list views into `TaskCard`.

**Tech Stack:** TypeScript, Hono, Prisma, Vitest, Vue 3, Pinia.

---

## File Structure

- Modify `apps/api/src/modules/tasks/permissions.ts` to add `canDeleteTask`.
- Modify `apps/api/src/tests/permissions.test.ts` to cover owner-only delete permission.
- Modify `apps/api/src/modules/tasks/service.ts` to add `deleteTask`.
- Modify `apps/api/src/modules/tasks/routes.ts` to add `DELETE /:id`.
- Modify `apps/web/src/stores/tasks.ts` to add `deleteTask`.
- Modify `apps/web/src/components/TaskCard.vue` to render and emit owner-only delete actions.
- Modify `apps/web/src/views/BoardView.vue` and `apps/web/src/views/TasksView.vue` to wire confirmation and deletion.
- Modify `apps/web/src/styles/main.css` to style the card delete action.

---

### Task 1: Backend Permission Test

- [ ] **Step 1: Write RED test**

In `apps/api/src/tests/permissions.test.ts`, import `canDeleteTask` and assert:

```ts
expect(canDeleteTask(UserRole.OWNER)).toBe(true);
expect(canDeleteTask(UserRole.MEMBER)).toBe(false);
expect(canDeleteTask(UserRole.TEACHER)).toBe(false);
```

- [ ] **Step 2: Run RED**

Run: `npm.cmd run test -w @quintask/api -- permissions`

Expected: FAIL because `canDeleteTask` does not exist.

- [ ] **Step 3: Implement helper**

In `apps/api/src/modules/tasks/permissions.ts`, add:

```ts
export function canDeleteTask(role: UserRoleType): boolean {
  return role === UserRole.OWNER;
}
```

- [ ] **Step 4: Run GREEN**

Run: `npm.cmd run test -w @quintask/api -- permissions`

Expected: PASS.

---

### Task 2: Backend Delete Endpoint

- [ ] **Step 1: Implement service**

Add `deleteTask(id, currentUser)` in `apps/api/src/modules/tasks/service.ts`. It rejects non-owners, checks existence, throws not found when missing, then deletes the task.

- [ ] **Step 2: Wire route**

In `apps/api/src/modules/tasks/routes.ts`, import `deleteTask` and add:

```ts
taskRoutes.delete("/:id", async (c) => {
  return ok(c, await deleteTask(c.req.param("id"), c.get("user")));
});
```

- [ ] **Step 3: Verify backend**

Run: `npm.cmd run test -w @quintask/api -- permissions`

Expected: PASS.

Run: `npm.cmd run typecheck -w @quintask/api`

Expected: PASS.

---

### Task 3: Frontend Store Delete Action

- [ ] **Step 1: Add action**

In `apps/web/src/stores/tasks.ts`, add `deleteTask(id)` that sends `DELETE /tasks/:id`, clears `currentTask` if needed, and reloads the task list.

- [ ] **Step 2: Verify typing**

Run: `npm.cmd run typecheck -w @quintask/web`

Expected: PASS.

---

### Task 4: Task Card Delete UI

- [ ] **Step 1: Add props and emit**

In `TaskCard.vue`, add optional `canDelete` and `deleting` props and a `delete` emit.

- [ ] **Step 2: Render button**

Render a delete button in the card header only when `canDelete` is true. Use `@click.stop` so it does not open the detail page.

- [ ] **Step 3: Verify component typing**

Run: `npm.cmd run typecheck -w @quintask/web`

Expected: PASS after parent wiring is complete.

---

### Task 5: Parent Wiring

- [ ] **Step 1: Board view**

In `BoardView.vue`, keep a `deletingTaskId`, confirm before deletion, call `tasksStore.deleteTask(id)`, and pass props/events to `TaskCard`.

- [ ] **Step 2: Tasks view**

In `TasksView.vue`, import auth, repeat the same delete handler, and pass props/events to `TaskCard`.

- [ ] **Step 3: Style button**

In `main.css`, add compact delete-button styles that fit inside the existing task-card header.

- [ ] **Step 4: Verify frontend**

Run: `npm.cmd run typecheck -w @quintask/web`

Expected: PASS.

---

### Task 6: Final Verification

- [ ] **Step 1: Run tests**

Run: `npm.cmd test`

Expected: PASS.

- [ ] **Step 2: Run lint/typecheck**

Run: `npm.cmd run lint`

Expected: PASS.

- [ ] **Step 3: Run build**

Run: `npm.cmd run build`

Expected: PASS.
