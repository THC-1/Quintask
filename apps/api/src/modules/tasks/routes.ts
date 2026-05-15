import { Hono } from "hono";

import { created, ok, readJson } from "../../lib/http.js";
import { authMiddleware } from "../../middleware/auth.js";
import { changeTaskStatus, createTask, getTask, listTasks, updateTask } from "./service.js";

export const taskRoutes = new Hono();

taskRoutes.use("*", authMiddleware);

taskRoutes.get("/", async (c) => {
  return ok(c, await listTasks());
});

taskRoutes.post("/", async (c) => {
  return created(c, await createTask(await readJson(c), c.get("user")));
});

taskRoutes.get("/:id", async (c) => {
  return ok(c, await getTask(c.req.param("id")));
});

taskRoutes.patch("/:id", async (c) => {
  return ok(c, await updateTask(c.req.param("id"), await readJson(c), c.get("user")));
});

taskRoutes.post("/:id/status", async (c) => {
  return ok(c, await changeTaskStatus(c.req.param("id"), await readJson(c), c.get("user")));
});
