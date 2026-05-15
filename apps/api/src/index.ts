import { serve } from "@hono/node-server";

import { app } from "./app.js";
import { config } from "./config.js";

serve({
  fetch: app.fetch,
  port: config.port,
});

console.log(`API server running at http://localhost:${config.port}`);
