import {
  signal,
  computed,
  debouncedSignal,
  type ReadonlySignal,
  type WritableSignal,
} from '@web-loom/signals-core';

export class QueryableCollectionViewModel<T extends Record<string, any>> {
  private allItems$: WritableSignal<T[]>;
  private readonly _debouncedFilter: ReturnType<typeof debouncedSignal<string>>;

  public currentPage$: WritableSignal<number>;
  public pageSize$: WritableSignal<number>;
  public filterBy$: WritableSignal<string>; // For simple text search
  public sortBy$: WritableSignal<keyof T | null>;
  public sortDirection$: WritableSignal<'asc' | 'desc'>;

  public readonly totalItems$: ReadonlySignal<number>; // Total items after filtering
  public readonly totalPages$: ReadonlySignal<number>;
  public readonly paginatedItems$: ReadonlySignal<T[]>;

  constructor(
    initialItems: T[] = [],
    initialPageSize: number = 10,
    initialSortBy: keyof T | null = null,
    initialSortDirection: 'asc' | 'desc' = 'asc',
  ) {
    this.allItems$ = signal<T[]>([...initialItems]);
    this.currentPage$ = signal<number>(1);
    this.pageSize$ = signal<number>(initialPageSize > 0 ? initialPageSize : 10);
    this.filterBy$ = signal<string>('');
    this.sortBy$ = signal<keyof T | null>(initialSortBy);
    this.sortDirection$ = signal<'asc' | 'desc'>(initialSortDirection);

    // Debounce filter input so rapid typing doesn't reprocess the collection
    this._debouncedFilter = debouncedSignal(this.filterBy$, 150);

    const processedItems$ = computed(() => {
      const items = this.allItems$.get();
      const filter = this._debouncedFilter.get();
      const sortBy = this.sortBy$.get();
      const sortDirection = this.sortDirection$.get();

      let processed = [...items];

      // Filtering (simple case-insensitive search on all string or number properties)
      if (filter && filter.trim() !== '') {
        const lowerFilter = filter.toLowerCase().trim();
        processed = processed.filter((item) =>
          Object.keys(item).some((key) => {
            const value = item[key];
            if (typeof value === 'string' || typeof value === 'number') {
              return String(value).toLowerCase().includes(lowerFilter);
            }
            return false;
          }),
        );
      }

      // Sorting
      if (sortBy) {
        processed.sort((a, b) => {
          const valA = a[sortBy];
          const valB = b[sortBy];

          if (valA === null || valA === undefined) return sortDirection === 'asc' ? -1 : 1;
          if (valB === null || valB === undefined) return sortDirection === 'asc' ? 1 : -1;

          if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
      return processed;
    });

    this.totalItems$ = computed(() => processedItems$.get().length);

    this.totalPages$ = computed(() =>
      Math.max(1, Math.ceil(this.totalItems$.get() / this.pageSize$.get())),
    ); // Ensure at least 1 page

    this.paginatedItems$ = computed(() => {
      const items = processedItems$.get();
      const currentPage = this.currentPage$.get();
      const pageSize = this.pageSize$.get();
      const totalPages = this.totalPages$.get();

      // Adjust current page if it's out of bounds due to filtering or page size change
      const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
      if (this.currentPage$.peek() !== validCurrentPage) {
        // Postpone the write to avoid mutating state inside a computed evaluation
        Promise.resolve().then(() => {
          if (this.currentPage$.peek() !== validCurrentPage) {
            this.currentPage$.set(validCurrentPage);
          }
        });
      }

      const startIndex = (validCurrentPage - 1) * pageSize;
      return items.slice(startIndex, startIndex + pageSize);
    });
  }

  public loadItems(items: T[]): void {
    this.allItems$.set([...items]);
    // Optionally reset to first page, or let current page adjust automatically
    // this.goToPage(1);
  }

  public addItem(item: T): void {
    this.allItems$.set([...this.allItems$.peek(), item]);
  }

  public removeItem(identifier: keyof T, value: any): void {
    this.allItems$.set(this.allItems$.peek().filter((item) => item[identifier] !== value));
  }

  public updateItem(identifier: keyof T, value: any, updatedItem: Partial<T>): void {
    this.allItems$.set(
      this.allItems$.peek().map((item) => (item[identifier] === value ? { ...item, ...updatedItem } : item)),
    );
  }

  public goToPage(page: number): void {
    // Validation is handled by the paginatedItems$ logic reacting to totalPages$
    this.currentPage$.set(page);
  }

  public nextPage(): void {
    // Just increment; paginatedItems$ will clamp.
    this.currentPage$.set(this.currentPage$.peek() + 1);
  }

  public prevPage(): void {
    this.currentPage$.set(Math.max(1, this.currentPage$.peek() - 1));
  }

  public setFilter(query: string): void {
    this.filterBy$.set(query);
    // No need to manually reset page to 1 here, paginatedItems$ logic will adjust if currentPage becomes invalid
  }

  public setSort(key: keyof T | null, direction?: 'asc' | 'desc'): void {
    const previousKey = this.sortBy$.peek();
    this.sortBy$.set(key);
    if (direction) {
      this.sortDirection$.set(direction);
    } else if (previousKey === key) {
      // Toggle direction if same key
      this.sortDirection$.set(this.sortDirection$.peek() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortDirection$.set('asc'); // Default to 'asc' for new sort key
    }
    // No need to manually reset page to 1 here
  }

  public setPageSize(size: number): void {
    this.pageSize$.set(size > 0 ? size : 1);
    // No need to manually reset page to 1 here
  }

  public dispose(): void {
    this._debouncedFilter.dispose();
  }
}
