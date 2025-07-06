// Global type declarations for Angular app

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

// Shared styles module declaration
declare module '@repo/shared/styles' {
  const content: string;
  export default content;
}

// Allow importing CSS files from shared package
declare module '@repo/shared/src/css/*' {
  const content: string;
  export default content;
}

// Web Loom design system declarations
declare module '@web-loom/design-core/design-system' {
  const content: string;
  export default content;
}

declare module '@web-loom/design-core/design-system/index.css' {
  const content: string;
  export default content;
}

declare module '@web-loom/design-core/css/*' {
  const content: string;
  export default content;
}
