# Web-Loom Port Assignments

This document outlines the systematic port assignments for all experimental apps to avoid conflicts when running multiple apps simultaneously.

## Port Assignment Strategy

- **Next.js apps**: 3000-3099
- **Angular apps**: 4200-4299 (Angular's default range)
- **Vite apps**: 5173-5199 (Vite's default starting from 5173)
- **API/Backend**: 8000-8099

## Current Port Assignments

| App                    | Framework       | Port | Command       |
| ---------------------- | --------------- | ---- | ------------- |
| docs                   | Next.js         | 3000 | `npm run dev` |
| mvvm-book              | Next.js         | 3001 | `npm run dev` |
| plugin-docs            | Next.js         | 3002 | `npm run dev` |
| mvvm-angular           | Angular         | 4200 | `npm run dev` |
| mvvm-react             | Vite + React    | 5173 | `npm run dev` |
| mvvm-vue               | Vite + Vue      | 5174 | `npm run dev` |
| mvvm-vanilla           | Vite + Vanilla  | 5175 | `npm run dev` |
| mvvm-lit               | Vite + Lit      | 5176 | `npm run dev` |
| mvvm-react-integrated  | Vite + React    | 5177 | `npm run dev` |
| task-flow-ui           | Vite + React    | 5178 | `npm run dev` |
| ui-patterns-playground | Vite + React    | 5179 | `npm run dev` |
| plugin-react           | Vite + React    | 5180 | `npm run dev` |
| api                    | Node.js/Express | 8000 | `npm run dev` |
| task-flow-api          | Node.js/Express | 8001 | `npm run dev` |

### API/UI Pairings

| UI App       | API App       | UI Port | API Port |
| ------------ | ------------- | ------- | -------- |
| task-flow-ui | task-flow-api | 5178    | 8001     |
| mvvm-*       | api           | varies  | 8000     |

## Running Multiple Apps

You can now run all apps simultaneously without port conflicts:

```bash
# Terminal 1
cd apps/docs && npm run dev

# Terminal 2
cd apps/mvvm-book && npm run dev

# Terminal 3
cd apps/mvvm-angular && npm run dev

# Terminal 4
cd apps/mvvm-react && npm run dev

# Terminal 5
cd apps/api && npm run dev

# ... and so on
```

## Killing All Development Servers

Use the updated `kill_ports.sh` script to stop all development servers:

```bash
./kill_ports.sh
```

## Adding New Apps

When adding new experimental apps:

- **Next.js apps**: Use next available port in 3000-3099 range
- **Angular apps**: Use next available port in 4200-4299 range
- **Vite apps**: Use next available port in 5173-5199 range
- **API/Backend**: Use next available port in 8000-8099 range

## Configuration Details

### Vite Apps

Ports are configured in `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    port: 5173, // Your assigned port
    strictPort: true, // Fail if port is in use instead of trying alternatives
  },
  // ... other config
});
```

**Important**: All Vite configs now include `strictPort: true` to prevent automatic fallback to different ports, making conflicts explicit.

### Next.js Apps

Ports are configured in package.json scripts:

```json
{
  "scripts": {
    "dev": "next dev --port 3000"
  }
}
```

### Angular Apps

Ports are configured in package.json scripts:

```json
{
  "scripts": {
    "dev": "ng serve --port 4200"
  }
}
```

### Node.js/Express Apps

Ports are configured via environment variable:

```json
{
  "scripts": {
    "dev": "PORT=8000 nodemon ..."
  }
}
```

## Troubleshooting Port Conflicts

### Issue: Apps fall back to different ports during `turbo dev`

**Symptoms**:

- Vite apps show "Port 5174 is in use, trying another one..."
- Apps end up on unexpected ports like 5180
- Next.js apps fail with "EADDRINUSE" errors

**Root Cause**: When running `turbo dev`, multiple apps start simultaneously, creating race conditions and temporary port conflicts.

**Solutions**:

#### Option 1: Use Enhanced Kill Script (Recommended)

```bash
# Always run this before starting development
./kill_ports.sh

# Then run your turbo command
turbo dev
```

#### Option 2: Start Apps Individually

Instead of `turbo dev`, start specific apps as needed:

```bash
# Terminal 1 - API first (other apps depend on it)
cd apps/api && npm run dev

# Terminal 2 - React demo
cd apps/mvvm-react && npm run dev

# Terminal 3 - Vue demo
cd apps/mvvm-vue && npm run dev

# And so on...
```

#### Option 3: Sequential Startup Script

Create a simple startup script to start apps with delays:

```bash
#!/bin/bash
# Clean up first
./kill_ports.sh && sleep 2

# Start in sequence
cd apps/api && npm run dev &
sleep 5
cd ../mvvm-react && npm run dev &
sleep 3
cd ../mvvm-vue && npm run dev &
sleep 3
cd ../mvvm-angular && npm run dev &
```

### Issue: Node.js API fails to start

**Symptoms**:

- `npm error code 130`
- Process terminates unexpectedly

**Solutions**:

1. Ensure you're using the correct Node.js version: `nvm use 24`
2. Make sure the PORT environment variable is set correctly
3. Check database connectivity (the API uses SQLite)
4. Try starting the API individually first

### Verification Commands

Check if ports are properly assigned:

```bash
# Check specific port
lsof -i :5173

# Check all assigned ports
lsof -i :3000-3002 -i :4200 -i :5173-5180 -i :8000-8001
```
