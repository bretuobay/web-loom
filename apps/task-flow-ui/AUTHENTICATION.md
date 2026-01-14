# TaskFlow UI Authentication

`apps/task-flow-ui` ships with a token-backed `AuthViewModel`. It persists the session via `localStorage`, keeps `taskFlowApiClient` supplied with the current token, and publishes a `userObservable` that components can subscribe to. The auth page (`/auth`) is the only route mounted outside of the protected shell.

## How routes are protected

1. `AuthPage` renders `AuthPanel`, which is wired to `AuthViewModel` for login/registration flows.
2. `App.tsx` now wraps the main shell with `AuthGuard`. `AuthGuard` uses `useObservable` to read `userObservable`, redirects unauthenticated visitors to `/auth`, and reuses `React Router`’s `<Navigate>` so the requested path is preserved in `state.from`.
3. Any shared ViewModel or layout under the shell assumes `AuthViewModel` has produced a current user. To add additional protected pages, wrap their element tree in `<AuthGuard viewModel={authViewModel}>…</AuthGuard>` (or reuse the existing shell route).

## Updating auth behavior

- Extend `AuthViewModel` with new commands (e.g., MFA, session refresh) whenever the API grows. Its `persistSession` helper already hydrates `taskFlowApiClient` and writes to `localStorage`.
- When building new pages (TaskBoard, Projects, etc.), always rely on the authenticated user via `useObservable(authViewModel.userObservable, null)` and guard `null` states before running APIs.
- If the UX should allow previews, wrap those pages in a lighter guard that shows read-only data while still defaulting to `<AuthGuard>` for any mutation.

Follow the same guard pattern when adding new routes to keep `/tasks`, `/projects`, and the plugin registry behind sign-in.
