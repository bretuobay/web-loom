import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, distinctUntilChanged, startWith, debounceTime } from 'rxjs/operators';

export class QueryableCollectionViewModel<T extends Record<string, any>> {
  private allItems$: BehaviorSubject<T[]>;

  public currentPage$: BehaviorSubject<number>;
  public pageSize$: BehaviorSubject<number>;
  public filterBy$: BehaviorSubject<string>; // For simple text search
  public sortBy$: BehaviorSubject<keyof T | null>;
  public sortDirection$: BehaviorSubject<'asc' | 'desc'>;

  public readonly totalItems$: Observable<number>; // Total items after filtering
  public readonly totalPages$: Observable<number>;
  public readonly paginatedItems$: Observable<T[]>;

  constructor(
    initialItems: T[] = [],
    initialPageSize: number = 10,
    initialSortBy: keyof T | null = null,
    initialSortDirection: 'asc' | 'desc' = 'asc'
  ) {
    this.allItems$ = new BehaviorSubject<T[]>([...initialItems]);
    this.currentPage$ = new BehaviorSubject<number>(1);
    this.pageSize$ = new BehaviorSubject<number>(initialPageSize > 0 ? initialPageSize : 10);
    this.filterBy$ = new BehaviorSubject<string>('');
    this.sortBy$ = new BehaviorSubject<keyof T | null>(initialSortBy);
    this.sortDirection$ = new BehaviorSubject<'asc' | 'desc'>(initialSortDirection);

    const processedItems$ = combineLatest([
      this.allItems$,
      this.filterBy$.pipe(debounceTime(150), distinctUntilChanged()), // Debounce filter input
      this.sortBy$.pipe(distinctUntilChanged()),
      this.sortDirection$.pipe(distinctUntilChanged())
    ]).pipe(
      map(([items, filter, sortBy, sortDirection]) => {
        let processed = [...items];

        // Filtering (simple case-insensitive search on all string or number properties)
        if (filter && filter.trim() !== '') {
          const lowerFilter = filter.toLowerCase().trim();
          processed = processed.filter(item =>
            Object.keys(item).some(key => {
              const value = item[key];
              if (typeof value === 'string' || typeof value === 'number') {
                return String(value).toLowerCase().includes(lowerFilter);
              }
              return false;
            })
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
      })
    );

    this.totalItems$ = processedItems$.pipe(
      map(items => items.length),
      startWith(initialItems.length),
      distinctUntilChanged()
    );

    this.totalPages$ = combineLatest([this.totalItems$, this.pageSize$]).pipe(
      map(([totalItems, pageSize]) => Math.max(1, Math.ceil(totalItems / pageSize))), // Ensure at least 1 page
      distinctUntilChanged()
    );

    this.paginatedItems$ = combineLatest([
      processedItems$,
      this.currentPage$,
      this.pageSize$,
      this.totalPages$ // Include totalPages to react to its changes for current page adjustment
    ]).pipe(
      map(([items, currentPage, pageSize, totalPages]) => {
        // Adjust current page if it's out of bounds due to filtering or page size change
        const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
        if (this.currentPage$.getValue() !== validCurrentPage) {
          // Postpone the update to avoid synchronous emission issues within combineLatest
           Promise.resolve().then(() => this.currentPage$.next(validCurrentPage));
        }

        const startIndex = (validCurrentPage - 1) * pageSize;
        return items.slice(startIndex, startIndex + pageSize);
      }),
      startWith(initialItems.slice(0, initialPageSize)) // Initial paginated view
    );
  }

  public loadItems(items: T[]): void {
    this.allItems$.next([...items]);
    // Optionally reset to first page, or let current page adjust automatically
    // this.goToPage(1);
  }

  public addItem(item: T): void {
    this.allItems$.next([...this.allItems$.getValue(), item]);
  }

  public removeItem(identifier: keyof T, value: any): void {
    this.allItems$.next(this.allItems$.getValue().filter(item => item[identifier] !== value));
  }

  public updateItem(identifier: keyof T, value: any, updatedItem: Partial<T>): void {
    this.allItems$.next(
        this.allItems$.getValue().map(item => (item[identifier] === value ? { ...item, ...updatedItem } : item))
    );
  }


  public goToPage(page: number): void {
    // Validation will be handled by the paginatedItems$ logic reacting to totalPages$
    this.currentPage$.next(page);
  }

  public nextPage(): void {
    // Access totalPages value directly or from an observable if needed for stricter check
    // For simplicity, just increment. paginatedItems$ will clamp.
    this.currentPage$.next(this.currentPage$.getValue() + 1);
  }

  public prevPage(): void {
    this.currentPage$.next(Math.max(1, this.currentPage$.getValue() - 1));
  }

  public setFilter(query: string): void {
    this.filterBy$.next(query);
    // No need to manually reset page to 1 here, paginatedItems$ logic will adjust if currentPage becomes invalid
  }

  public setSort(key: keyof T | null, direction?: 'asc' | 'desc'): void {
    this.sortBy$.next(key);
    if (direction) {
      this.sortDirection$.next(direction);
    } else if (this.sortBy$.getValue() === key) { // Toggle direction if same key
      this.sortDirection$.next(this.sortDirection$.getValue() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortDirection$.next('asc'); // Default to 'asc' for new sort key
    }
    // No need to manually reset page to 1 here
  }

  public setPageSize(size: number): void {
    this.pageSize$.next(size > 0 ? size : 1);
    // No need to manually reset page to 1 here
  }

  public dispose(): void {
    this.allItems$.complete();
    this.currentPage$.complete();
    this.pageSize$.complete();
    this.filterBy$.complete();
    this.sortBy$.complete();
    this.sortDirection$.complete();
  }
}
