/// <reference types="vite/client" />

declare module '*.loom' {
  import type { Template } from '@web-loom/template-core';
  const template: Template;
  export default template;
}
