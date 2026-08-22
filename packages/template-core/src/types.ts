export type ExpressionNode =
  | { kind: 'literal'; value: string | number | boolean | null }
  | { kind: 'path'; segments: string[]; parentHops: number }
  | { kind: 'helper-call'; callee: string; args: ExpressionNode[] }
  | { kind: 'unary-not'; operand: ExpressionNode }
  | { kind: 'binary'; op: '===' | '!==' | '<' | '<=' | '>' | '>='; left: ExpressionNode; right: ExpressionNode }
  | { kind: 'logical'; op: '&&' | '||' | '??'; left: ExpressionNode; right: ExpressionNode };

export interface Scope {
  parent: Scope | null;
  self: unknown;
  locals: Record<string, unknown>;
  /**
   * Dev-mode reporter set on root scopes when `TemplateOptions.dev` is on.
   * Called with the root segment of a data path that resolves against neither
   * `locals` nor `self` — the silent-empty-render failure mode.
   */
  onUnresolved?: (rootSegment: string) => void;
}

export type NodePath = number[];

export type TextPart = { static: string } | { expr: ExpressionNode };

export type BindingRecord =
  | { kind: 'text'; path: NodePath; parts: TextPart[] }
  | { kind: 'raw-html'; path: NodePath; expr: ExpressionNode }
  | { kind: 'attr-interp'; path: NodePath; name: string; parts: TextPart[] }
  | { kind: 'prop-or-attr'; path: NodePath; name: string; expr: ExpressionNode }
  | { kind: 'class'; path: NodePath; name: string; expr: ExpressionNode }
  | { kind: 'style'; path: NodePath; prop: string; expr: ExpressionNode }
  | { kind: 'event'; path: NodePath; event: string; handler: ExpressionNode; modifiers?: EventModifier[] }
  | {
      kind: 'bind';
      path: NodePath;
      name: 'value' | 'checked';
      target: ExpressionNode;
      setter?: ExpressionNode;
    }
  | { kind: 'action'; path: NodePath; expr: ExpressionNode };

export type EventModifier = 'prevent' | 'stop' | 'once' | 'capture' | 'passive' | 'enter' | 'escape';

export type PartialSource = string | Template;

export interface TemplateRegistry {
  get(name: string): PartialSource | undefined;
  set(name: string, source: PartialSource): void;
  delete(name: string): void;
  has(name: string): boolean;
}

export type DiagnosticSeverity = 'warning' | 'error';

export interface TemplateDiagnostic {
  code: string;
  severity: DiagnosticSeverity;
  message: string;
  template?: string;
  sourcePath?: string;
  line?: number;
  column?: number;
  expression?: string;
  nodePath?: NodePath;
  details?: unknown;
}

export interface SourceLocation {
  line: number;
  column: number;
  offset?: number;
}

export interface TemplateDiagnostics {
  report?(diagnostic: TemplateDiagnostic): void;
  warn?(message: string, details?: unknown): void;
  error?(message: string, details?: unknown): void;
}

export interface ElementAction {
  update?(): void;
  dispose?(): void;
}

export interface IfBranch {
  condition: ExpressionNode | null;
  template: RootTemplate;
}

export type BlockRecord =
  | { kind: 'if'; path: NodePath; branches: IfBranch[] }
  | {
      kind: 'each';
      path: NodePath;
      source: ExpressionNode;
      key: ExpressionNode;
      template: RootTemplate;
      empty?: RootTemplate;
    }
  | { kind: 'switch'; path: NodePath; source: ExpressionNode; branches: SwitchBranch[] }
  | {
      kind: 'partial';
      path: NodePath;
      name: string;
      context: ExpressionNode | null;
      args?: Record<string, ExpressionNode> | null;
      slots?: Record<string, RootTemplate>;
    };

export interface SwitchBranch {
  value: ExpressionNode | null;
  template: RootTemplate;
}

export interface RootTemplate {
  blueprint: DocumentFragment;
  bindings: BindingRecord[];
  blocks: BlockRecord[];
}

export interface TemplateOptions {
  /**
   * Custom `{{ }}` delimiters. **Not yet implemented in Phase 1** — reserved
   * for forward compatibility with the PRD's public API; templates always
   * use `{{ }}` / `{{{ }}}` today.
   */
  delimiters?: [string, string];
  /** Whether `{{ }}` escapes its output. Defaults to `true`. */
  escape?: boolean;
  /** Named functions resolvable from call-form expressions (`{{ formatDate(createdAt$) }}`). */
  helpers?: Record<string, (...args: unknown[]) => unknown>;
  /** Named templates available to `{{> name}}` (local entries override globals). */
  partials?: Record<string, PartialSource>;
  /** Scoped partial registry used after local `partials` and before the global registry. */
  registry?: TemplateRegistry;
  /** Optional name included in diagnostics and runtime errors. */
  name?: string;
  /** Optional source path included in compiler and runtime diagnostics. */
  sourcePath?: string;
  sourceMap?: Record<string, SourceLocation>;
  /** Throw instead of warning when a partial cannot be resolved. */
  strictPartials?: boolean;
  /**
   * When true, this template never inherits a caller's scope when used as a
   * partial — even if invoked as `{{> name}}` with no arguments.
   */
  isolated?: boolean;
  /**
   * Optional per-mount hook used by `@web-loom/view` `defineComponent`.
   * Receives the evaluated props object and may return extra context plus a
   * dispose callback that runs when the partial unmounts.
   */
  createContext?(props: object): { context: object; dispose?(): void };
  /**
   * Enables development-only diagnostics, currently `UNRESOLVED_CONTEXT_PATH`
   * warnings when a template path's root segment does not exist on the scope
   * it resolves against. The Vite plugins turn this on in dev builds.
   */
  dev?: boolean;
  diagnostics?: TemplateDiagnostics;
}

export interface RenderContext {
  helpers: Record<string, (...args: unknown[]) => unknown>;
  escape: boolean;
  partials?: Record<string, PartialSource>;
  registry?: TemplateRegistry;
  templateName?: string;
  strictPartials?: boolean;
  diagnostics?: TemplateDiagnostics;
  sourcePath?: string;
  sourceMap?: Record<string, SourceLocation>;
  reportDiagnostic?: (diagnostic: TemplateDiagnostic) => void;
  partialDepth?: number;
  partialStack?: string[];
  /**
   * Slot frames pushed while instantiating a block partial. `{{> yield}}`
   * reads the innermost frame and binds slot markup against the caller scope.
   */
  slotStack?: Array<{ slots: Record<string, RootTemplate>; callerScope: Scope }>;
  /** SSR-only slot frames; slot bodies stay as parse5 node lists. */
  serverSlotStack?: Array<{ slots: Record<string, unknown[]>; callerScope: Scope }>;
  /** True only during the first browser binding pass over SSR-created nodes. */
  hydrating?: boolean;
}

/** An object with a `dispose(): void` method — the `mvvm-core` cleanup convention. */
export interface Disposable {
  dispose(): void;
}

/** A compiled template, returned by {@link compile}. */
export interface Template<TVm extends object = object> {
  /** Clones the template, wires reactive bindings against `viewModel`, and appends it to `container`. */
  mount(container: Element, viewModel: TVm): Disposable;
  /** Builds a detached, already-reactive fragment for callers that manage insertion themselves. */
  render(viewModel: TVm): { node: DocumentFragment; dispose(): void };
  /** Attaches bindings to matching SSR markup, recovering by remounting on mismatch. */
  hydrate(container: Element, viewModel: TVm): Disposable;
  /** Serializes the template using the browser renderer when available. */
  renderToString(viewModel: TVm): string;
  /** See {@link TemplateOptions.isolated}. */
  isolated?: boolean;
  /** See {@link TemplateOptions.createContext}. */
  createContext?(props: object): { context: object; dispose?(): void };
  /**
   * Local `{{> name}}` map for this template. Set at `compile()` or attached
   * later (e.g. `withPartials`) so a page can import children without the
   * global registry.
   */
  partials?: Record<string, PartialSource>;
}

export interface TemplateOutlet extends Disposable {
  show<TVm extends object>(template: Template<TVm>, viewModel: TVm): Disposable;
  clear(): void;
}

export interface SerializableTemplatePlan {
  version: 2;
  source: string;
  preprocessed: string;
  name?: string;
  sourcePath?: string;
  sourceMap?: Record<string, SourceLocation>;
  root?: SerializableRootTemplate;
}

export interface SerializableNode {
  kind: 'element' | 'text' | 'comment' | 'doctype';
  name?: string;
  namespace?: string | null;
  value?: string;
  attributes?: Array<{ name: string; value: string }>;
  children?: SerializableNode[];
}

export interface SerializableRootTemplate {
  nodes: SerializableNode[];
  bindings: BindingRecord[];
  blocks: SerializableBlockRecord[];
  compiled?: boolean;
}

export type SerializableBlockRecord =
  | {
      kind: 'if';
      path: NodePath;
      branches: Array<{ condition: ExpressionNode | null; template: SerializableRootTemplate }>;
    }
  | {
      kind: 'each';
      path: NodePath;
      source: ExpressionNode;
      key: ExpressionNode;
      template: SerializableRootTemplate;
      empty?: SerializableRootTemplate;
    }
  | {
      kind: 'switch';
      path: NodePath;
      source: ExpressionNode;
      branches: Array<{ value: ExpressionNode | null; template: SerializableRootTemplate }>;
    }
  | {
      kind: 'partial';
      path: NodePath;
      name: string;
      context: ExpressionNode | null;
      args?: Record<string, ExpressionNode> | null;
      slots?: Record<string, SerializableRootTemplate>;
    };

export interface PrecompileOptions {
  name?: string;
  sourcePath?: string;
}

/** Options for Node-safe {@link analyzeTemplate} — extends precompile metadata with static checks. */
export interface AnalyzeOptions extends PrecompileOptions {
  /** When provided, unresolved `{{> name }}` references emit `MISSING_PARTIAL` diagnostics. */
  partials?: Record<string, PartialSource>;
  /** Treat missing partials as errors instead of warnings during analysis. */
  strictPartials?: boolean;
  /**
   * Top-level keys of the context object the template mounts against. When
   * provided, data-path roots outside those keys emit `UNKNOWN_CONTEXT_PATH`
   * diagnostics. Only root-scope expressions are checked — `{{#each}}` bodies
   * re-scope `self` to the item, whose shape static analysis cannot know.
   */
  contextKeys?: string[];
}

export interface AnalyzeResult {
  /** False when any diagnostic has `severity: 'error'`. */
  ok: boolean;
  plan: SerializableTemplatePlan;
  diagnostics: TemplateDiagnostic[];
}

/** Options for Node-safe {@link formatTemplate}. */
export interface FormatTemplateOptions extends AnalyzeOptions {
  /** Spaces per indent level (default 2). */
  indent?: number;
}

export interface FormatTemplateResult {
  /** False when any diagnostic has `severity: 'error'`. */
  ok: boolean;
  /** Present when {@link ok} is true. */
  formatted?: string;
  diagnostics: TemplateDiagnostic[];
  /** True when formatted output equals input (after trailing newline normalization). */
  unchanged?: boolean;
}

export interface PrecompiledTemplateModule {
  plan: SerializableTemplatePlan;
}
