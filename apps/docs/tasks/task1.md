### **Phase 1 — Project Setup**

**Prompt:**

> You are building a Next.js documentation website located at `apps/docs` in a Turborepo monorepo.
>
> 1. You have a Next.js app initialized a Next.js app in `apps/docs`
> 2. Install these dependencies, check if they are not installed already:
>
>    ```
>    @next/mdx next-themes @tailwindcss/typography gray-matter remark rehype rehype-prism-plus lucide-react
>    ```
>
>    And dev dependencies:
>
>    ```
>    prettier-plugin-tailwindcss prettier-plugin-mdx
>    ```
>
> 3. Configure Tailwind CSS with `@tailwindcss/typography`.
> 4. Enable MDX support using `@next/mdx` or `next-mdx-remote`.
> 5. Create a base layout with a **sidebar**, **top navigation bar**, and **content area**.
> 6. Ensure the layout is responsive with mobile menu support.

**Deliverable:**

- Base project with Tailwind + MDX working.
- A test MDX page rendering in the layout.

Create a pull request. If a specific task continuously fails, create a pull request so I can pull and debug locally.
