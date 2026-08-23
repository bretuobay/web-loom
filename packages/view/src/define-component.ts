import type { PartialSource, Template } from '@web-loom/template-core';
import { warnPartialPropDiagnostics } from './report-partial-props.js';

export interface ComponentSetupResult {
  dispose?(): void;
  [key: string]: unknown;
}

export interface DefineComponentOptions<TProps extends object> {
  name: string;
  props?: readonly (keyof TProps & string)[];
  template: Template;
  /** Local children this component may `{{> name}}`. Overrides inherited maps. */
  partials?: Record<string, PartialSource>;
  setup?(props: TProps): ComponentSetupResult | void;
}

/**
 * Marks a compiled template as an isolated component. Call sites pass named
 * hash arguments (`{{> card count=n}}`); the component never inherits the
 * caller scope. `setup` runs on each `{{> }}` mount and on root
 * `mount`/`hydrate`, and its `dispose` runs on unmount.
 */
export function defineComponent<TProps extends object>(options: DefineComponentOptions<TProps>): Template<TProps> {
  const template = options.template as Template<TProps>;
  template.isolated = true;
  template.props = options.props;
  if (options.partials) {
    template.partials = { ...template.partials, ...options.partials };
  }
  warnPartialPropDiagnostics(template, options.name);
  template.createContext = (rawProps) => {
    const props = pickProps(rawProps, options.props) as TProps;
    const extras = options.setup?.(props);
    const { dispose, ...rest } = extras ?? {};
    return {
      context: { ...props, ...rest },
      dispose: typeof dispose === 'function' ? dispose : undefined,
    };
  };
  return template;
}

function pickProps(raw: object, keys: readonly string[] | undefined): object {
  if (!keys) return raw;
  const picked: Record<string, unknown> = {};
  const source = raw as Record<string, unknown>;
  for (const key of keys) {
    picked[key] = source[key];
  }
  return picked;
}
