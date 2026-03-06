# Building Extensible Web Applications

**A Complete Guide to TypeScript Plugin Architecture**

*By Festus Yeboah · Foreword by Evans Boateng Owusu*

---

This is the Next.js site that hosts the complete Plugin Architecture book. It is part of the [web-loom](https://github.com/bretuobay/web-loom) monorepo and is not a starter template.

The book covers plugin system design from first principles through to production deployment, drawing patterns from real open-source systems: VS Code, Vite, Babel, Kibana, Backstage, Beekeeper Studio, NocoBase, TinaCMS, and Vendure.

## Book Structure

| Part | Chapters | Topic |
|------|----------|-------|
| I | 1–4 | Foundations and Theory |
| II | 5–8 | Implementation and Architecture |
| III | 9–10 | Security, Testing, and Best Practices |
| IV | 11–13 | Real-World Applications |
| V | 14–15 | Production and Optimisation |
| — | Appendices A–E | Reference Material |

Content lives in `content/docs/`. Each `.mdx` file maps to a chapter or appendix.

## Local Development

From the monorepo root:

```bash
nvm use 23
npm install
turbo run dev --filter=plugin-docs
```

Or from this directory:

```bash
npm run dev
```

The site runs at [http://localhost:3002](http://localhost:3002).

## Editing Content

All book content is in `content/docs/` as `.mdx` files. File names are prefixed with a two-digit chapter number:

```
content/docs/
  00-foreword.mdx
  00-table-of-contents.mdx
  01-foundations-of-plugin-architecture.mdx
  ...
  15-deployment-versioning-distribution.mdx
  16-appendices-and-reference-material.mdx
```

The site reads frontmatter from each file to build navigation (`nextTitle`, `nextSlug`, `topicTitle`, `topicSlug`).

## Building for Production

```bash
npm run build
```

This produces a static export in `out/`. The site is deployed as a Cloudflare Workers static asset bundle using `wrangler.plugin-docs.jsonc` at the monorepo root.

```bash
# Deploy (from monorepo root)
wrangler deploy --config wrangler.plugin-docs.jsonc
```

## Tech Stack

- [Next.js](https://nextjs.org/) with Turbopack
- MDX for chapter content
- Tailwind CSS for styling
- Cloudflare Workers for hosting (static export)
