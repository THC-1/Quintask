# Owner Task Edit Design

Date: 2026-05-19

## Goal

Add full task editing for the project owner. Members and teachers keep their current behavior:

- Owners can edit the full task definition from the task detail page.
- Members cannot edit task fields yet; they can still move their own assigned tasks through the allowed workflow, manage subtasks on their own tasks, and comment.
- Teachers remain read-only.

## Scope

The first implementation adds owner-only editing for:

- Title
- Description
- Priority
- Assignee
- Milestone
- Due date
- Tags
- Dependency tasks

Task status is intentionally excluded from the edit form. Status changes must continue to use the existing status-transition endpoint so dependency checks and workflow rules remain centralized.

Delete task, bulk edit, member edit permissions, tag creation inside the task form, milestone creation inside the task form, and attachment support are out of scope.

## User Experience

On `TaskDetailView`, owners see an `Edit task` action near the existing task actions. Selecting it switches the detail page into an edit form with the current task values prefilled.

The edit form provides:

- Text input for title.
- Textarea for description.
- Select for priority.
- Select for assignee, including an unassigned option.
- Select for milestone, including a no-milestone option.
- Date input for due date, including clearing the date.
- Multi-select or checkbox list for tags.
- Multi-select or checkbox list for dependency tasks.

Saving submits the full edited payload, reloads the task detail, and exits edit mode. Canceling discards local form changes and returns to the read-only detail view.

The dependency selector must exclude the current task so an owner cannot choose a task as its own dependency.

## Backend Design

Keep the existing `PATCH /api/tasks/:id` endpoint and continue requiring `OWNER`.

Extend task update support to accept `tagIds` and `dependencyIds` in addition to the existing scalar fields. Validation rules:

- Reject non-owner callers with `FORBIDDEN`.
- Reject invalid scalar fields using the existing shared schema validation.
- Validate `assigneeId`, `milestoneId`, `tagIds`, and `dependencyIds` when they are provided.
- Deduplicate `tagIds` and `dependencyIds`.
- Reject self-dependency where `dependencyIds` includes the current task id.
- Leave task status updates blocked through this endpoint.

Persistence rules:

- Scalar fields update only when present.
- `tagIds` replaces the task's current tag relationships only when provided.
- `dependencyIds` replaces the task's current dependency relationships only when provided.
- The response includes the same task relationship data shape already used by task detail/list consumers.

## Frontend Design

Add task editing support to the Pinia task store:

- Introduce an `UpdateTaskInput` type matching the owner-editable fields.
- Add `updateTask(id, input)` that calls `PATCH /tasks/:id`.
- After saving, reload the current task when it is open; otherwise reload the task list.

`TaskDetailView` will own the edit form state. It will load supporting option data for owners:

- Users from `GET /api/users` for assignee choices.
- Milestones from `GET /api/milestones` for milestone choices.
- Tags from `GET /api/tags` for tag choices.
- Existing task list from the task store for dependency choices.

If loading option data fails, the page shows the existing store/API error style and keeps the user on the detail page.

## Error Handling

Use existing API error handling and Chinese-facing store/page errors. Important cases:

- Non-owner attempts to update return `FORBIDDEN`.
- Missing related records return validation errors.
- Self-dependency returns validation error.
- Failed save keeps the edit form open so the owner can correct and retry.

## Testing

Backend tests should cover:

- Owners can update scalar fields.
- Owners can replace tags and dependencies.
- Self-dependency is rejected.
- Members and teachers cannot use task update.
- Status remains unsupported through `PATCH /api/tasks/:id`.

Frontend verification should cover:

- Owner sees and can use the edit task form.
- Member and teacher do not see the edit entry point.
- Saving updates the detail view.
- Canceling discards local form changes.
