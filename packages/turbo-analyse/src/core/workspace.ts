import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

export interface WorkspaceProject {
  name: string;
  path: string;
  type: 'app' | 'package' | 'unknown';
  packageJson: any;
  hasScript: (script: string) => boolean;
}

export interface TurboConfig {
  pipeline?: Record<string, any>;
  globalDependencies?: string[];
}

export interface WorkspaceConfig {
  rootPath: string;
  rootPackageJson: any;
  turboConfig?: TurboConfig;
  projects: WorkspaceProject[];
}

export async function loadWorkspaceConfig(cwd: string): Promise<WorkspaceConfig> {
  const rootPackageJsonPath = join(cwd, 'package.json');
  const turboConfigPath = join(cwd, 'turbo.json');

  if (!existsSync(rootPackageJsonPath)) {
    throw new Error(`No package.json found at ${rootPackageJsonPath}`);
  }

  const rootPackageJson = JSON.parse(await readFile(rootPackageJsonPath, 'utf8'));

  let turboConfig: TurboConfig | undefined;
  if (existsSync(turboConfigPath)) {
    turboConfig = JSON.parse(await readFile(turboConfigPath, 'utf8'));
  }

  const projects = await discoverProjects(cwd, rootPackageJson);

  return {
    rootPath: cwd,
    rootPackageJson,
    turboConfig,
    projects,
  };
}

async function discoverProjects(rootPath: string, rootPackageJson: any): Promise<WorkspaceProject[]> {
  const workspaces = getWorkspacePatterns(rootPackageJson);
  const projects: WorkspaceProject[] = [];

  for (const pattern of workspaces) {
    // Simple pattern matching - in a full implementation we'd use a glob library
    // For now, handle basic patterns like "packages/*" and "apps/*"
    const parts = pattern.split('/');

    if (parts.length === 2 && parts[1] === '*') {
      const baseDir = parts[0];
      if (!baseDir) continue;
      const basePath = join(rootPath, baseDir);

      if (existsSync(basePath)) {
        try {
          const { readdir } = await import('node:fs/promises');
          const entries = await readdir(basePath, { withFileTypes: true });

          for (const entry of entries) {
            if (entry.isDirectory()) {
              const projectPath = join(basePath, entry.name);
              const packageJsonPath = join(projectPath, 'package.json');

              if (existsSync(packageJsonPath)) {
                try {
                  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));
                  const project: WorkspaceProject = {
                    name: packageJson.name || entry.name,
                    path: projectPath,
                    type: inferProjectType(packageJson, baseDir!),
                    packageJson,
                    hasScript: (script: string) => Boolean(packageJson.scripts?.[script]),
                  };
                  projects.push(project);
                } catch (error) {
                  // Skip projects with invalid package.json
                  console.warn(`Warning: Could not parse package.json for ${entry.name}`);
                }
              }
            }
          }
        } catch (error) {
          // Skip directories that can't be read
          console.warn(`Warning: Could not read directory ${basePath}`);
        }
      }
    }
  }

  return projects;
}

function getWorkspacePatterns(packageJson: any): string[] {
  if (packageJson.workspaces) {
    if (Array.isArray(packageJson.workspaces)) {
      return packageJson.workspaces;
    }
    if (packageJson.workspaces.packages) {
      return packageJson.workspaces.packages;
    }
  }

  // Check pnpm-workspace.yaml would require yaml parsing, skipping for now
  return [];
}

function inferProjectType(packageJson: any, baseDir: string): 'app' | 'package' | 'unknown' {
  // Simple heuristics for determining if something is an app or package

  // Check if it's in apps directory
  if (baseDir === 'apps') {
    return 'app';
  }

  // Check if it's in packages directory
  if (baseDir === 'packages') {
    return 'package';
  }

  // Check for app-like dependencies
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const appIndicators = ['next', 'react-scripts', 'vite', '@vitejs/plugin-react', 'nuxt', 'vue', '@angular/core'];

  if (appIndicators.some((indicator) => dependencies[indicator])) {
    return 'app';
  }

  // Check for binary field (might be a CLI package)
  if (packageJson.bin) {
    return 'package';
  }

  // Default to package for libraries
  if (packageJson.main || packageJson.module || packageJson.exports) {
    return 'package';
  }

  return 'unknown';
}

export function findProject(config: WorkspaceConfig, nameOrPath: string): WorkspaceProject | undefined {
  return config.projects.find((p) => p.name === nameOrPath || p.path.endsWith(nameOrPath) || p.path === nameOrPath);
}

export function getProjectsByType(config: WorkspaceConfig, type: 'app' | 'package'): WorkspaceProject[] {
  return config.projects.filter((p) => p.type === type);
}
