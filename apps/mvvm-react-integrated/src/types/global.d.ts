// Global type declarations for the project

declare module '*.css' {
  const content: string;
  export default content;
}

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

// Add other CSS module declarations as needed
declare module '@repo/shared/styles' {
  const content: string;
  export default content;
}
