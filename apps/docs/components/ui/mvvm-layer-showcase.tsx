'use client';

import { useEffect, useState } from 'react';

type Layer = {
  id: 'model' | 'viewmodel' | 'view';
  title: string;
  file: string;
  language: 'ts' | 'tsx';
  summary: string;
  code: string;
};

type CodeToken = {
  kind: 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'call' | 'punctuation' | 'property';
  text: string;
};

const keywords = new Set([
  'import',
  'from',
  'export',
  'class',
  'extends',
  'private',
  'readonly',
  'const',
  'return',
  'async',
  'await',
  'new',
  'if',
  'else',
  'void',
  'type',
]);

const tokenClassNames: Record<CodeToken['kind'], string> = {
  plain: 'text-slate-200',
  keyword: 'text-fuchsia-300',
  string: 'text-emerald-300',
  comment: 'text-slate-500 italic',
  number: 'text-amber-300',
  type: 'text-sky-300',
  call: 'text-blue-300',
  punctuation: 'text-slate-400',
  property: 'text-cyan-300',
};

const isIdentifierStart = (ch: string) => /[A-Za-z_$]/.test(ch);
const isIdentifierChar = (ch: string) => /[A-Za-z0-9_$]/.test(ch);

const pushToken = (tokens: CodeToken[], token: CodeToken) => {
  if (!token.text) {
    return;
  }

  const last = tokens[tokens.length - 1];
  if (last && last.kind === token.kind) {
    last.text += token.text;
    return;
  }

  tokens.push(token);
};

const tokenizeLine = (line: string): CodeToken[] => {
  const tokens: CodeToken[] = [];
  let index = 0;

  while (index < line.length) {
    const current = line[index];
    const next = line[index + 1] ?? '';

    if (current === '/' && next === '/') {
      pushToken(tokens, { kind: 'comment', text: line.slice(index) });
      break;
    }

    if (current === '\'' || current === '"' || current === '`') {
      const quote = current;
      let end = index + 1;
      let escaped = false;

      while (end < line.length) {
        const ch = line[end];
        if (escaped) {
          escaped = false;
          end += 1;
          continue;
        }
        if (ch === '\\') {
          escaped = true;
          end += 1;
          continue;
        }
        if (ch === quote) {
          end += 1;
          break;
        }
        end += 1;
      }

      pushToken(tokens, { kind: 'string', text: line.slice(index, end) });
      index = end;
      continue;
    }

    if (/[0-9]/.test(current)) {
      let end = index + 1;
      while (end < line.length && /[0-9_.]/.test(line[end])) {
        end += 1;
      }
      pushToken(tokens, { kind: 'number', text: line.slice(index, end) });
      index = end;
      continue;
    }

    if (isIdentifierStart(current)) {
      let end = index + 1;
      while (end < line.length && isIdentifierChar(line[end])) {
        end += 1;
      }

      const identifier = line.slice(index, end);
      let kind: CodeToken['kind'] = 'plain';

      if (keywords.has(identifier)) {
        kind = 'keyword';
      } else if (identifier === 'this') {
        kind = 'property';
      } else if (/^[A-Z]/.test(identifier)) {
        kind = 'type';
      } else {
        let lookahead = end;
        while (lookahead < line.length && /\s/.test(line[lookahead])) {
          lookahead += 1;
        }
        if (line[lookahead] === '(') {
          kind = 'call';
        }
      }

      pushToken(tokens, { kind, text: identifier });
      index = end;
      continue;
    }

    if ('{}[]().,;:=<>!?+-*/%&|'.includes(current)) {
      pushToken(tokens, { kind: 'punctuation', text: current });
      index += 1;
      continue;
    }

    pushToken(tokens, { kind: 'plain', text: current });
    index += 1;
  }

  return tokens;
};

const layers: Layer[] = [
  {
    id: 'model',
    title: 'Model',
    file: 'features/catalog/CatalogModel.ts',
    language: 'ts',
    summary: 'Owns API/cache lifecycle and pushes canonical data state.',
    code: `export class CatalogModel extends BaseModel<CatalogProductDto[], any> {
  private readonly query = new QueryCore({
    cacheProvider: 'localStorage',
    defaultRefetchAfter: 2 * 60 * 1000,
  });
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await this.query.defineEndpoint('catalog:products:v3', () => this.api.listProducts());
    this.query.subscribe('catalog:products:v3', (state) => this.syncFromQueryState(state));
    this.initialized = true;
  }

  async fetchAll(forceRefetch = false): Promise<void> {
    await this.ensureInitialized();
    await this.query.refetch('catalog:products:v3', forceRefetch);
  }

  private syncFromQueryState(state: EndpointState<CatalogProductDto[]>): void {
    this.setLoading(state.isLoading);
    if (state.data) this.setData(state.data);
    if (state.error) this.setError(state.error);
  }
}`,
  },
  {
    id: 'viewmodel',
    title: 'ViewModel',
    file: 'features/catalog/CatalogViewModel.ts',
    language: 'ts',
    summary: 'Derives UI state and exposes intent as commands.',
    code: `export class CatalogViewModel extends ActiveAwareViewModel<CatalogModel> {
  private readonly productsState = signal<CatalogProductDto[]>([]);
  private readonly searchState = signal('');

  readonly filteredProducts = computed(() => {
    const q = this.searchState.get().trim().toLowerCase();
    const items = this.productsState.get();
    return q ? items.filter((p) => p.name.toLowerCase().includes(q)) : items;
  });

  constructor(model: CatalogModel) {
    super(model);
    this.addSubscription(this.model.data$.subscribe((items) => this.productsState.set(items ?? [])));
  }

  readonly refreshCatalogCommand = this.registerCommand(
    new Command(async () => this.model.refresh()),
  );

  setSearchQuery(value: string): void {
    this.searchState.set(value);
  }
}`,
  },
  {
    id: 'view',
    title: 'View',
    file: 'App.tsx',
    language: 'tsx',
    summary: 'Framework layer binds VM state/commands into components.',
    code: `function CatalogRoute() {
  const products = useSignalValue(catalogViewModel.filteredProducts);
  const totalProducts = useSignalValue(catalogViewModel.totalProducts);
  const selectedProduct = useSignalValue(catalogViewModel.selectedProduct);
  const searchQuery = useSignalValue(catalogViewModel.searchQuery);
  const isLoading = useObservable(catalogViewModel.isLoading$, false);

  return (
    <ProductBrowser
      products={products}
      totalProducts={totalProducts}
      selectedProduct={selectedProduct}
      isLoading={isLoading}
      searchQuery={searchQuery}
      onSearchChange={(value) => catalogViewModel.setSearchQuery(value)}
      onRefresh={() => void catalogViewModel.refreshCatalogCommand.execute()}
      onAddToCart={(productId) => void cartViewModel.addToCartCommand.execute({ productId, quantity: 1 })}
    />
  );
}`,
  },
];

const renderHighlightedCode = (code: string, language: Layer['language']) => {
  const lines = code.split('\n');

  return (
    <code className={`block min-w-max language-${language}`}>
      {lines.map((line, lineIndex) => {
        const tokens = tokenizeLine(line);
        return (
          <span key={`${language}-line-${lineIndex}`} className="block whitespace-pre">
            <span className="inline-block w-8 mr-4 text-right select-none text-slate-600">
              {lineIndex + 1}
            </span>
            {tokens.map((token, tokenIndex) => (
              <span key={`${lineIndex}-${token.kind}-${tokenIndex}`} className={tokenClassNames[token.kind]}>
                {token.text}
              </span>
            ))}
          </span>
        );
      })}
    </code>
  );
};

export default function MVVMLayerShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % layers.length);
    }, 3600);

    return () => clearInterval(interval);
  }, [isPaused]);

  const activeLayer = layers[activeIndex];

  return (
    <div
      className="rounded-xl border border-slate-700/60 bg-slate-950 overflow-hidden font-mono text-[12.5px] leading-relaxed shadow-lg shadow-slate-950/40"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-slate-800">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-700" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-full bg-slate-700" aria-hidden="true" />
        <span className="w-2.5 h-2.5 rounded-full bg-slate-700" aria-hidden="true" />
        <span className="ml-2 text-xs text-slate-500">{activeLayer.file}</span>
        <span className="ml-auto rounded border border-blue-500/35 bg-blue-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-blue-300">
          {activeLayer.language.toUpperCase()}
        </span>
      </div>

      <div className="px-4 pt-3 pb-2 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {layers.map((layer, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={[
                  'rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors',
                  isActive
                    ? 'border-blue-400/70 bg-blue-500/15 text-blue-300'
                    : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300',
                ].join(' ')}
                aria-pressed={isActive}
              >
                {layer.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-[425px]">
        {layers.map((layer, index) => {
          const isActive = index === activeIndex;
          return (
            <pre
              key={layer.id}
              className={[
                'absolute inset-0 p-5 overflow-x-auto transition-all duration-500',
                isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
              ].join(' ')}
            >
              {renderHighlightedCode(layer.code, layer.language)}
            </pre>
          );
        })}
      </div>

      <div className="border-t border-slate-800 px-5 py-2.5 flex items-center justify-between gap-4 text-xs">
        <span className="text-slate-500">
          <span className="text-blue-400">{activeLayer.title}</span> - {activeLayer.summary}
        </span>
        <span className="text-slate-600">
          Real excerpts from <code className="text-slate-400">apps/ecommerce-mvvm/src</code>
        </span>
      </div>
    </div>
  );
}
