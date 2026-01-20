# Dev Helper CLIs

These helpers keep ports predictable and remind you that the demo APIs/frontends are not production-grade.

## `demo-runner.js`

Runs `apps/api` plus one or more `mvvm-*` frontends:

- Default mode: `npm run demo:start` launches the API plus `mvvm-react`.
- Add `--frontends=mvvm-vue,mvvm-lit` to include additional frontends, or use `--frontends=all` to start every frontend marked as safe for demos.
- Pass `--list` to see all available frontends with their pinned ports.
- Use `--dry-run` to inspect the `cd ... && npm run dev` commands without starting anything.
- Running `npm run demo:start --frontends=...` without the extra `--` still works because the helper checks `npm_config_frontends`, but using `npm run demo:start -- --frontends=...` avoids npm's "Unknown env config" warning.
  `npm run demo:start -- --frontends=mvvm-vue,mvvm-lit`

The helper prints a friendly header about the demo nature of this stack and forces strict ports before spawning each process.

## `task-flow-runner.js`

Use `npm run demo:task-flow` to start `task-flow-api` (port 8001) and `task-flow-ui` (port 5178) at the same time.

- `--dry-run` shows the commands that would run.
- The helper reiterates that the stack is seeded/demo only so you can safely experiment.
