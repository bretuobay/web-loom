export interface TemplateCoreLintSettings {
  /** Partial names declared in the project (values are documentation paths only). */
  partials?: Record<string, string>;
  /** Declared hash-arg names per partial — enables `no-invalid-partial-props`. */
  partialProps?: Record<string, readonly string[]>;
  /** Module specifiers scanned for `compile()` imports. */
  specifiers?: string[];
  /** Treat missing partials as errors during analysis. Default: true when `partials` is set. */
  strictPartials?: boolean;
  /** Top-level context keys templates mount against — enables the `no-unknown-context-path` rule. */
  contextKeys?: string[];
}

export function getTemplateCoreSettings(settings: Record<string, unknown> | undefined): TemplateCoreLintSettings {
  const templateCore = settings?.['template-core'];
  if (!templateCore || typeof templateCore !== 'object') return {};
  return templateCore as TemplateCoreLintSettings;
}
