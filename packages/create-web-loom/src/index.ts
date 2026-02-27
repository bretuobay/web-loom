import { runVite } from './vite.js';
import { detectScaffold } from './detect.js';
import { installPackages } from './install.js';
import { injectBoilerplate } from './boilerplate.js';

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

  // Step 2: Detect scaffold details produced by Vite
  let scaffold: ReturnType<typeof detectScaffold>;
  try {
    scaffold = detectScaffold(projectDir);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n✖  ${message}`);
    process.exit(1);
  }

  console.log(`\n✔  Detected framework: ${scaffold.framework}`);
  console.log(`✔  Detected template variant: ${scaffold.variant}`);

  // Step 3: Install @web-loom/* packages
  try {
    installPackages(projectDir, scaffold.framework);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n✖  ${message}`);
    process.exit(1);
  }

  // Step 4: Overlay Web Loom starter templates
  console.log('\nApplying Web Loom starter overlay...');
  try {
    injectBoilerplate(projectDir, scaffold);
    console.log('✔  Starter overlay written (runnable Vite starter files replaced).');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n✖  ${message}`);
    process.exit(1);
  }

  // Step 5: Print success + next steps
  console.log(`
╔══════════════════════════════════════════════════╗
║  ✅  Your Web Loom project is ready!             ║
╚══════════════════════════════════════════════════╝

  Next steps:

    cd ${resolvedName}
    npm install
    npm run dev

  The generated app now boots with Web Loom starter templates
  overlaid on Vite's framework scaffold.

  Docs: https://github.com/your-org/web-loom
`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
