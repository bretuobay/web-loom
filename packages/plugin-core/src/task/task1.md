You are an expert technical writer and TypeScript developer. You are writing a `README.md`(inside packages/plugin-core/README.md) file for a framework-agnostic TypeScript package that helps build plugin-based web interfaces. This package is meant to be used to implement **React-based plugins**, but the underlying logic is decoupled from React and can be used with any framework.

### 📁 Start reading code from:

`src/index.ts` (packages/plugin-core/src/index.ts) — this is the main public entry point of the package. From there, recursively explore all internal modules to understand the purpose, architecture, and API surface of the package.

---

### 🎯 Goals:

1. **High-level overview**: Explain what the package does and what problems it solves.
2. **Installation**: Show how to install it with `npm` or `pnpm`.
3. **Conceptual structure**: Describe how plugins are defined and registered.
4. **API Documentation**: Describe all exported classes, types, and functions with short but useful descriptions.
5. **React Example**:
   - Show how to build a basic React plugin using the exported primitives.
   - Include a simple `<PluginHost />` and `<Plugin />` example.
   - Demonstrate data/state passing if applicable.

6. **Advanced Usage**:
   - Mention extensibility hooks or plugin lifecycle if available.
   - Describe integration strategy if used in a larger framework.

7. **TypeScript Support**: Mention that the package is fully typed.

8. **Good Practices**:
   - Show how to organize a plugin directory.
   - Mention testing approaches if relevant.

9. **License and Contribution**: Add standard MIT license boilerplate and a contribution guide link if one exists.

---

### 📌 Constraints:

- Use **Markdown best practices**: clear headings, code blocks, badges if any, and links.
- Keep it **developer-friendly** — it should help someone go from zero to "first plugin built" quickly.
- Maintain a **neutral, professional tone**, like the React or Vite docs.

---

### ✅ Output:

Your output should be a complete, publish-ready `README.md` file, including all the sections listed above. All code samples must be syntactically correct and runnable with minimal setup.

You can assume that `src/index.ts` exports the primary API and serves as the entry point for users.

---

Once done, print only the contents of the `README.md` file.
