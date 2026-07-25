import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createTemplateCoreViteSsrServer } from '@web-loom/template-core-vite-ssr';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const server = await createTemplateCoreViteSsrServer({
  root,
  entry: mode === 'production' ? './dist/server/entry-server.js' : '/src/entry-server.ts',
  mode,
  port: Number(process.env.PORT ?? 5182),
});

await server.listen();
console.log(`ecommerce-template-core SSR server listening on http://localhost:${process.env.PORT ?? 5182}`);
