# Owner Task Delete Design

Date: 2026-05-19

## Goal

Add task-card deletion for project owners. Members and teachers keep their current behavior and cannot delete tasks.

## Scope

The implementation adds:

- Owner-only task deletion.
- A delete action on task cards.
- A confirmation step before deletion.
- List refresh after deletion.

Out of scope:

- Soft delete or restore.
- Bulk delete.
- Member delete permissions.
- Deleting from subtasks or comments independently.

## Backend Design

Add `DELETE /api/tasks/:id`.

Rules:

- Only `OWNER` can delete tasks.
- `MEMBER` and `TEACHER` receive `FORBIDDEN`.
- Missing task id receives `NOT_FOUND`.
- Deleting a task removes related subtasks, comments, task-tag rows, and dependency rows according to Prisma relation cascade rules.

## Frontend Design

The task card accepts owner delete state from its parent:

- `canDelete`: whether to show the delete action.
- `deleting`: whether that card is currently deleting.
- `delete` event: emitted when the user confirms intent to delete.

The delete button appears only for owners. It stops click propagation so it does not open the task detail page.

`BoardView` and `TasksView` pass `auth.isOwner` and call `tasksStore.deleteTask(id)` after a browser confirmation. After deletion, the task list refreshes through the store.

## Error Handling

Use existing API/store error handling:

- Permission errors show the existing forbidden message.
- Not-found errors show the existing not-found message.
- Failed deletion leaves the list as-is and shows a page/store error.

## Testing

Backend tests cover:

- Owner deletion permission helper behavior.
- Member and teacher denial.

Frontend verification covers:

- Owners see the delete action on task cards.
- Members and teachers do not see the delete action.
- Clicking delete does not navigate to task detail.
- Confirmed delete refreshes the list.
