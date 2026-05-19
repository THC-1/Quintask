# Task Create Page Design

Date: 2026-05-19

## Goal

Replace the inline task creation form on BoardView with a dedicated full-page form at `/tasks/new`. The new page lets owners fill in all task fields at creation time, eliminating the need to create first and edit later.

## Scope

- New `TaskCreateView.vue` at route `/tasks/new` (owner-only)
- Remove inline create form from `BoardView.vue`, replace with a button linking to `/tasks/new`
- Extend `tasksStore.createTask()` to accept all fields the backend already supports
- Backend and shared schema: no changes needed

Out of scope: member suggestion flow, bulk create, tag/milestone creation inside the form.

## Route

```
{ path: "/tasks/new", name: "task-create", component: TaskCreateView, meta: { requiresOwner: true } }
```

Place the route **before** `/tasks/:id` in the route array so `new` is not captured as an `:id` param.

## BoardView Changes

Remove:
- `createForm` reactive state (lines 27-32)
- `createLoading`, `createError` refs (lines 23-24)
- `canCreateTask` computed (line 33)
- `submitTask()` function (lines 51-81)
- The `<form class="inline-create-form">` block (lines 156-181)

Add:
- A button linking to `/tasks/new`, visible only for owners:
  ```html
  <RouterLink v-if="auth.isOwner" class="primary-button" :to="{ name: 'task-create' }">
    创建任务
  </RouterLink>
  ```

Using `auth.isOwner` (not `canCreateTask`) because the route requires owner role anyway — showing the button to members would lead to a confusing redirect.

## TaskCreateView

### Form Fields

| Field | Required | Input | Notes |
|-------|----------|-------|-------|
| title | yes | text | |
| priority | yes | select (LOW/MEDIUM/HIGH) | default MEDIUM |
| assigneeId | yes | select | active non-teacher users |
| milestoneId | yes | select | all milestones |
| dueDate | yes | date | |
| description | yes | textarea | |
| tagIds | yes (≥1) | checkbox list | at least one tag |
| dependencyIds | no | checkbox list | excludes self (moot for create, but structurally same as edit form) |

### Option Loading

On mount, parallel-fetch users, milestones, tags, and tasks (for dependency options). Same pattern as `TaskDetailView.loadEditOptions()`.

Loading state: show placeholder text in select/checkbox areas. Error state: show error message, keep form disabled.

### Validation

Frontend validation before submit:
- title: non-empty after trim
- description: non-empty after trim
- assigneeId: non-empty
- milestoneId: non-empty
- dueDate: non-empty
- tagIds: at least one selected

Show per-field error or a summary error. Submit button disabled when `createLoading` is true.

### Submit Flow

1. Build payload matching `CreateTaskInput` (title, description, priority, assigneeId, milestoneId, dueDate, tagIds, dependencyIds)
2. Call `tasksStore.createTask(payload)`
3. On success: `router.push({ name: 'task-detail', params: { id: newTaskId } })`
4. On failure: show error, stay on form

To get the new task's ID after creation, the `createTask` store action must return it. Currently it does not — it only reloads the task list. The backend `POST /tasks` already returns the created task with its `id`, so the store action just needs to return that value.

### Cancel

`router.push({ name: 'board' })` or `router.back()`.

## Pinia Store Changes (`tasks.ts`)

### createTask signature

```ts
async createTask(input: {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string;
  milestoneId: string;
  dueDate: string | null;
  tagIds: string[];
  dependencyIds: string[];
})
```

The action returns `Promise<TaskDetail>` so the caller can get the new task's ID.

### Implementation

```ts
async createTask(input) {
  this.error = "";
  try {
    const task = await apiFetch<TaskDetail>("/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
    await this.loadTasks();
    return task;
  } catch (error) {
    this.error = toChineseError(error, "任务创建失败，请稍后重试");
    throw error;
  }
}
```

## Backend

No changes. `createTaskSchema` already accepts all fields. `createTask` service already handles OWNER role with full field normalization and relation validation.

## Error Handling

| Case | Behavior |
|------|----------|
| Validation fail (frontend) | Show error, disable submit |
| API error (network) | Show store error message |
| API error (validation) | Show Chinese error from backend |
| Option loading fail | Show error, disable form |
| Non-owner accesses route | Router guard redirects to dashboard |

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/views/TaskCreateView.vue` | New |
| `apps/web/src/views/BoardView.vue` | Remove inline form, add link button |
| `apps/web/src/stores/tasks.ts` | Expand createTask input, return created task |
| `apps/web/src/router.ts` | Add `/tasks/new` route |
