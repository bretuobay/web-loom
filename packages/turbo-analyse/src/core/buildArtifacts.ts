import { stat, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import type { WorkspaceProject } from './workspace.js';
import type { Config } from '../cli/dispatcher.js';

export interface ArtifactInfo {
  path: string;
  totalBytes: number;
  fileCount: number;
}

export interface ProjectArtifacts {
  project: WorkspaceProject;
  artifacts: ArtifactInfo[];
  totalBytes: number;
}

const DEFAULT_ARTIFACT_PATTERNS: Record<string, string[]> = {
  next: ['.next', 'dist', 'build'],
  'react-scripts': ['build'],
  vite: ['dist'],
  nuxt: ['.nuxt', '.output'],
  angular: ['dist'],
  vue: ['dist'],
  default: ['dist', 'build', 'lib'],
};

export async function getProjectArtifacts(
  project: WorkspaceProject,
  config?: Config,
  artifactGlobs?: string,
): Promise<ProjectArtifacts> {
  const patterns = getArtifactPatterns(project, config, artifactGlobs);
  const artifacts: ArtifactInfo[] = [];

  for (const pattern of patterns) {
    const artifactPath = resolve(project.path, pattern);

    if (existsSync(artifactPath)) {
      try {
        const stats = await stat(artifactPath);

        if (stats.isDirectory()) {
          const { totalBytes, fileCount } = await getDirectorySize(artifactPath);
          if (totalBytes > 0) {
            artifacts.push({
              path: pattern,
              totalBytes,
              fileCount,
            });
          }
        } else if (stats.isFile()) {
          artifacts.push({
            path: pattern,
            totalBytes: stats.size,
            fileCount: 1,
          });
        }
      } catch (error) {
        // Skip artifacts that can't be accessed
        console.warn(`Warning: Could not access artifact at ${artifactPath}`);
      }
    }
  }

  const totalBytes = artifacts.reduce((sum, artifact) => sum + artifact.totalBytes, 0);

  return {
    project,
    artifacts,
    totalBytes,
  };
}

function getArtifactPatterns(project: WorkspaceProject, config?: Config, override?: string): string[] {
  // Override takes precedence
  if (override) {
    return override.split(',').map((p) => p.trim());
  }

  // Check config for project-specific patterns
  if (config?.artifactGlobs) {
    const configPattern = config.artifactGlobs[project.name];
    if (configPattern) {
      return configPattern.split(',').map((p) => p.trim());
    }
  }

  // Infer from dependencies
  const dependencies = { ...project.packageJson.dependencies, ...project.packageJson.devDependencies };

  // Check for framework-specific patterns
  for (const [framework, patterns] of Object.entries(DEFAULT_ARTIFACT_PATTERNS)) {
    if (framework !== 'default' && dependencies[framework]) {
      return patterns;
    }
  }

  // Check for framework patterns by checking for related packages
  if (dependencies['next'] || dependencies['@next/core']) {
    return DEFAULT_ARTIFACT_PATTERNS['next'] || [];
  }

  if (dependencies['react-scripts']) {
    return DEFAULT_ARTIFACT_PATTERNS['react-scripts'] || [];
  }

  if (dependencies['vite'] || dependencies['@vitejs/plugin-react']) {
    return DEFAULT_ARTIFACT_PATTERNS['vite'] || [];
  }

  if (dependencies['nuxt']) {
    return DEFAULT_ARTIFACT_PATTERNS['nuxt'] || [];
  }

  if (dependencies['@angular/core']) {
    return DEFAULT_ARTIFACT_PATTERNS['angular'] || [];
  }

  // Default patterns
  return DEFAULT_ARTIFACT_PATTERNS['default'] || [];
}

async function getDirectorySize(dirPath: string): Promise<{ totalBytes: number; fileCount: number }> {
  let totalBytes = 0;
  let fileCount = 0;

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          const subResult = await getDirectorySize(fullPath);
          totalBytes += subResult.totalBytes;
          fileCount += subResult.fileCount;
        } else if (entry.isFile()) {
          const stats = await stat(fullPath);
          totalBytes += stats.size;
          fileCount++;
        }
      } catch (error) {
        // Skip files/directories that can't be accessed
        continue;
      }
    }
  } catch (error) {
    // Return zero if directory can't be read
    return { totalBytes: 0, fileCount: 0 };
  }

  return { totalBytes, fileCount };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function runBuildIfNeeded(projects: WorkspaceProject[], forceRun: boolean = false): Promise<boolean> {
  if (!forceRun) {
    // Check if any artifacts exist
    const hasAnyArtifacts = await Promise.all(
      projects.map(async (project) => {
        const patterns = getArtifactPatterns(project);
        return patterns.some((pattern) => existsSync(resolve(project.path, pattern)));
      }),
    );

    if (hasAnyArtifacts.some(Boolean)) {
      return true; // Artifacts exist, no need to build
    }
  }

  // Run turbo build
  console.log('Running turbo build...');

  try {
    const { spawn } = await import('node:child_process');

    const child = spawn('npx', ['turbo', 'run', 'build'], {
      stdio: 'inherit',
      shell: true,
    });

    const exitCode = await new Promise<number>((resolve) => {
      child.on('close', resolve);
    });

    if (exitCode !== 0) {
      throw new Error(`Build failed with exit code ${exitCode}`);
    }

    console.log('Build completed successfully');
    return true;
  } catch (error) {
    console.error('Failed to run build:', error);
    return false;
  }
}
