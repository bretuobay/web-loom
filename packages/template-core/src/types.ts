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
  | { kind: 'bind'; path: NodePath; name: 'value' | 'checked'; target: ExpressionNode }
  | { kind: 'action'; path: NodePath; expr: ExpressionNode };

export type EventModifier = 'prevent' | 'stop' | 'once' | 'capture' | 'passive' | 'enter' | 'escape';

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
  | { kind: 'partial'; path: NodePath; name: string; context: ExpressionNode | null };

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
  partials?: Record<string, string | Template>;
}

export interface RenderContext {
  helpers: Record<string, (...args: unknown[]) => unknown>;
  escape: boolean;
  partials?: Record<string, string | Template>;
  partialDepth?: number;
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
}
