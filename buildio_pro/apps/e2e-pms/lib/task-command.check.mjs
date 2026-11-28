import assert from "node:assert/strict";

import { parseTaskCommand } from "./task-command.ts";

assert.deepEqual(parseTaskCommand("Show tasks"), { href: "/tasks" });
assert.deepEqual(
  parseTaskCommand("  sHoW   completed tasks for Product\nlaunch! "),
  {
    href: "/tasks?project=Product%20launch&status=Done",
  },
);
assert.deepEqual(parseTaskCommand("Show in   progress tasks."), {
  href: "/tasks?status=In%20progress",
});
assert.deepEqual(parseTaskCommand("Show tasks for Website refresh"), {
  href: "/tasks?project=Website%20refresh",
});
assert.deepEqual(parseTaskCommand("Show completed tasks for Internal tools"), {
  href: "/tasks?project=Internal%20tools&status=Done",
});
assert.match(
  parseTaskCommand("Show tasks for Finance").error,
  /Unknown project/,
);
assert.match(parseTaskCommand("Show pending tasks").error, /Unknown status/);
assert.match(parseTaskCommand("Delete tasks").error, /Try/);
