# @web-loom/visdiff

A local-first, intelligent visual regression testing tool that catches UI bugs during development, not after deployment.

## Quick Start

```bash
npx @web-loom/visdiff init
npx @web-loom/visdiff watch
```

## The Vision

WebLoom VisDiff is being built in phases to transform how frontend teams handle visual quality. Here's our roadmap:

### 🟢 **Now Available (Phase 1)**

- **Local snapshot testing** - Capture and compare screenshots locally
- **Zero-config setup** - Works with any project in under 2 minutes
- **Multi-viewport support** - Mobile, tablet, and desktop screens
- **Git integration** - Automatic baseline management per branch
- **Simple CLI** - `visdiff watch` for instant feedback during development

### 🔵 **Coming Soon (Phase 2 - Q2 2024)**

- **Smart diffing** - AI-powered false positive reduction
- **Semantic understanding** - Knows the difference between layout, color, and content changes
- **Component isolation** - Test individual components, not just pages
- **Machine learning** - Learns from your project's patterns

### 🟡 **Planned (Phase 3 - Q3 2024)**

- **Framework integrations** - First-class support for React, Vue, Svelte, etc.
- **Interactive review UI** - Local dashboard for reviewing diffs
- **Storybook integration** - Test components in isolation
- **Development workflow** - Auto-capture on hot reload

### 🟠 **Future (Phase 4 - Q4 2024)**

- **Team collaboration** - Shared baselines and review workflows
- **Enterprise features** - SSO, audit logging, RBAC
- **Advanced scenarios** - Interaction states, animations, accessibility testing
- **Performance at scale** - Distributed capture for large test suites

### 🔴 **Long Term (2025+)**

- **Predictive analysis** - Prevent visual regressions before they happen
- **Design system enforcement** - Ensure implementation matches design tokens
- **Automatic fix suggestions** - AI-powered correction of visual issues
- **Ecosystem integration** - VS Code, GitHub, Figma plugins

## Core Philosophy

WebLoom VisDiff follows these principles:

1. **Local-first** - Everything works offline; no cloud requirement
2. **Zero-config defaults** - Smart defaults that work immediately
3. **Progressive disclosure** - Advanced features when you need them
4. **Framework agnostic** - Works with any frontend stack
5. **Git-native** - Baselines tied to your version control

## Contributing

We're building this in the open and welcome contributions! The project is MIT licensed, and we're particularly interested in:

- Framework-specific adapters
- Improved diffing algorithms
- Documentation and examples
- Performance optimizations

## Stay Updated

- **GitHub**: [github.com/web-loom/visdiff](https://github.com/bretuobay/web-loom/visdiff)

## License

MIT

---

**Our mission**: Make visual regression testing as accessible and essential as unit testing for every frontend developer.
