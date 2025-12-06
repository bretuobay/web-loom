# @web-loom/turbo-analyse

A Node-based CLI tool for analyzing and optimizing Turborepo monorepos. Get insights into your workspace structure, build artifacts, and project metrics without external dependencies.

## Features

- 📊 **Build Metrics** - Analyze build artifact sizes across apps and packages
- 🏗️ **Workspace Inspection** - Get detailed information about your monorepo structure
- 🎯 **Zero Dependencies** - Uses only Node.js core modules for maximum compatibility
- 📋 **Multiple Output Formats** - Human-readable tables or machine-readable JSON
- ⚙️ **Configurable** - Optional configuration file for custom artifact patterns
- 🚀 **Turbo Integration** - Works seamlessly with existing Turborepo workflows

## Installation

### Published Package (when available)

```bash
# Install globally
npm install -g @web-loom/turbo-analyse

# Or use with npx (no installation required)
npx @web-loom/turbo-analyse build metrics
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/bretuobay/web-loom.git
cd web-loom

# Install dependencies
npm install

# Build the package
cd packages/turbo-analyse
npm run build

# Test the CLI directly (recommended for development)
cd ../.. # Back to workspace root
node packages/turbo-analyse/bin/wl workspace info

# Or link globally for system-wide testing
cd packages/turbo-analyse
npm link
cd ../..
wl workspace info

# Or add to PATH temporarily
export PATH="$PWD/packages/turbo-analyse/bin:$PATH"
wl workspace info
```

**Note:** Always run the CLI from your workspace root directory (where `turbo.json` and root `package.json` are located) for proper workspace detection.

## Quick Start

```bash
# Show workspace overview
wl workspace info

# List all projects with details
wl workspace list

# Analyze build artifact sizes
wl build metrics

# Get help
wl --help
```

## Commands

### `workspace info`

Display a high-level summary of your Turborepo workspace.

```bash
wl workspace info

# Output:
# Workspace: my-monorepo
# Total projects: 12
# Apps: 4
# Packages: 8
# Turbo config: Yes
```

**Flags:**

- `--json` - Output as JSON for scripting

### `workspace list`

List all workspace projects with detailed information.

```bash
wl workspace list

# Show paths and scripts
wl workspace list --with-paths --with-scripts
```

**Flags:**

- `--json` - Output as JSON
- `--with-paths` - Include project paths
- `--with-scripts` - Include available npm scripts

### `build metrics`

Analyze build artifact sizes per app/package.

```bash
wl build metrics

# Analyze specific project
wl build metrics --project my-app

# Filter by project type
wl build metrics --type app

# Force build before analysis
wl build metrics --run-build

# Custom artifact pattern
wl build metrics --artifacts "dist/**,build/**"
```

**Flags:**

- `--project <name>` - Analyze specific workspace project
- `--type <app|package>` - Filter by project type
- `--artifacts <pattern>` - Override artifact path pattern
- `--json` - Output as JSON
- `--run-build` - Run `turbo run build` before analysis

## Configuration

Create an optional `turbo-analyse.config.json` in your workspace root to customize behavior:

```json
{
  "artifactGlobs": {
    "next-app": ".next,dist",
    "react-app": "build,dist",
    "vite-app": "dist",
    "package": "dist,lib"
  },
  "projectTypes": {
    "my-custom-app": "app",
    "my-lib": "package"
  }
}
```

### Configuration Options

- **`artifactGlobs`** - Map project types to artifact path patterns
- **`projectTypes`** - Manual overrides for project type detection

## Usage Examples

### CI/CD Integration

```bash
# Generate build metrics for CI reporting
wl build metrics --json > build-metrics.json

# Check workspace health
wl workspace info --json | jq '.totalProjects'
```

### Development Workflow

```bash
# Quick workspace overview
wl workspace info

# Find largest build artifacts
wl build metrics | sort -k4 -nr

# List projects with build scripts
wl workspace list --with-scripts | grep "Yes"
```

### Package Scripts Integration

Add to your root `package.json`:

```json
{
  "scripts": {
    "analysis:build": "wl build metrics",
    "analysis:workspace": "wl workspace info",
    "analysis:projects": "wl workspace list --with-paths"
  }
}
```

## Architecture

The CLI follows a modular architecture for easy extension:

```
src/
├── cli/
│   └── dispatcher.ts      # Command routing and argument parsing
├── core/
│   ├── workspace.ts       # Workspace discovery and parsing
│   ├── buildArtifacts.ts  # Artifact analysis
│   ├── output.ts          # Table and JSON formatting
│   └── config.ts          # Configuration loading
└── commands/
    ├── build/
    │   └── metrics.ts     # Build metrics command
    └── workspace/
        ├── info.ts        # Workspace info command
        └── list.ts        # Workspace list command
```

## Supported Environments

- **Node.js** 18+ (aligns with modern ecosystem)
- **Package managers** - npm, yarn, pnpm
- **Turborepo** - All versions with `turbo.json` support
- **Workspace formats** - Standard npm/yarn workspaces

## Project Type Detection

The CLI automatically detects project types using heuristics:

**Apps** (detected by):

- Location in `apps/` directory
- Dependencies: `next`, `react-scripts`, `vite`, `@angular/core`, etc.

**Packages** (detected by):

- Location in `packages/` directory
- Has `main`, `module`, `exports`, or `bin` fields
- Fallback for shared libraries

**Override detection** with `projectTypes` in config file.

## Output Formats

### Table Output

```
Project         Type     Artifact Path    Total Size
my-web-app     app      .next,dist       2.4 MB
ui-components  package  dist             156 KB
utils          package  lib              45 KB
```

### JSON Output

```json
[
  {
    "name": "my-web-app",
    "type": "app",
    "artifactPath": ".next,dist",
    "totalBytes": 2516582
  }
]
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes in `packages/turbo-analyse/`
4. Build and test: `npm run build && npm test`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Adding New Commands

1. Create command file in `src/commands/<domain>/<action>.ts`
2. Implement the `Command` interface
3. Register in `src/index.ts`
4. Add tests and documentation

## Troubleshooting

### Build Issues

```bash
# If TypeScript build fails, ensure dependencies are installed
cd packages/turbo-analyse
npm install
npm run build

# Check that JavaScript files are generated
ls -la dist/
find dist/ -name "*.js" | head -5
```

### Command not found

```bash
# If using npm link
npm link @web-loom/turbo-analyse

# Or use direct path (from workspace root)
node packages/turbo-analyse/bin/wl workspace info

# Or add to PATH temporarily
export PATH="$PWD/packages/turbo-analyse/bin:$PATH"
```

### "No package.json found" Error

- **Always run from workspace root** - The CLI must be executed from the directory containing your `turbo.json` and root `package.json`
- Ensure you're in a Turborepo workspace
- Check that workspace configuration exists (`workspaces` field in package.json)

### No projects found

- Ensure you're in a workspace root with `package.json`
- Check workspace configuration (`workspaces` field)
- Verify project directories exist
- Use `wl workspace list` to debug project detection

### No build artifacts

- Run `wl build metrics --run-build` to build first
- Check artifact patterns in config
- Ensure build scripts exist in projects
- Verify build outputs are in expected directories (`dist/`, `.next/`, `build/`, etc.)

## License

MIT © Web-Loom Contributors

## Related

- [Turborepo Documentation](https://turbo.build)
- [Turborepo Configuration Reference](https://turbo.build/repo/docs/reference/configuration)
- [Web-Loom Framework](https://github.com/bretuobay/web-loom)
