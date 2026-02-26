import { runVite } from './vite.js';
import { detectFramework } from './detect.js';
import { installPackages } from './install.js';
import { injectBoilerplate } from './boilerplate.js';
import type { Framework } from './detect.js';

const BANNER = `
  ╔══════════════════════════════════╗
  ║       create-web-loom  🧶        ║
  ║  MVVM scaffolding powered by Vite║
  ╚══════════════════════════════════╝
`;

async function main(): Promise<void> {
  console.log(BANNER);

  // Optional project name passed as first arg: `npm create web-loom my-app`
  const projectName = process.argv[2];

  // Step 1: Run Vite interactively
  let projectDir: string;
  let resolvedName: string;

  try {
    const result = runVite(projectName);
    projectDir = result.projectDir;
    resolvedName = result.projectName;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n✖  ${message}`);
    process.exit(1);
  }

  // Step 2: Detect the framework Vite scaffolded
  const framework: Framework = detectFramework(projectDir);
  console.log(`\n✔  Detected framework: ${framework}`);

  // Step 3: Install @web-loom/* packages
  try {
    installPackages(projectDir, framework);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n✖  ${message}`);
    process.exit(1);
  }

  // Step 4: Inject MVVM boilerplate
  console.log('\nInjecting Web Loom MVVM boilerplate...');
  injectBoilerplate(projectDir, framework);
  console.log('✔  Boilerplate written.');

  // Step 5: Print success + next steps
  console.log(`
╔══════════════════════════════════════════════════╗
║  ✅  Your Web Loom project is ready!             ║
╚══════════════════════════════════════════════════╝

  Next steps:

    cd ${resolvedName}
    npm install
    npm run dev

  Explore the generated MVVM boilerplate in src/:
    • viewmodels/CounterViewModel.ts  — your first ViewModel
    • components/Counter.tsx (or .vue) — the View
    • hooks/useObservable.ts           — the reactive bridge

  Docs: https://github.com/your-org/web-loom
`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
