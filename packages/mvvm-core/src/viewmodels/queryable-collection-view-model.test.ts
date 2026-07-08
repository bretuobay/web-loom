import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryableCollectionViewModel } from './queryable-collection-view-model';

// Advance past the 150ms filter debounce, then flush the microtask used
// by the page-clamping logic inside paginatedItems$.
const advanceCollectionTimers = async (time = 200) => {
  vi.advanceTimersByTime(time);
  await Promise.resolve();
  await Promise.resolve();
};

interface TestItem {
  id: number;
  name: string;
  category: string;
  value: number;
  nullableProp?: string | null;
}

const sampleData: TestItem[] = [
  { id: 1, name: 'Apple', category: 'Fruit', value: 10 },
  { id: 2, name: 'Banana', category: 'Fruit', value: 20 },
  { id: 3, name: 'Carrot', category: 'Vegetable', value: 5 },
  { id: 4, name: 'Duck', category: 'Meat', value: 50 },
  { id: 5, name: 'Eggplant', category: 'Vegetable', value: 15 },
  { id: 6, name: 'Fig', category: 'Fruit', value: 25, nullableProp: 'hasValue' },
  { id: 7, name: 'Grape', category: 'Fruit', value: 30 },
  { id: 8, name: 'Honeydew', category: 'Fruit', value: 40, nullableProp: null },
  { id: 9, name: 'Iceberg Lettuce', category: 'Vegetable', value: 12 },
  { id: 10, name: 'Jackfruit', category: 'Fruit', value: 100 },
  { id: 11, name: 'Kiwi', category: 'Fruit', value: 22 },
  { id: 12, name: 'Lemon', category: 'Fruit', value: 8 },
];

describe('QueryableCollectionViewModel', () => {
  let viewModel: QueryableCollectionViewModel<TestItem>;

  beforeEach(() => {
    vi.useFakeTimers();
    viewModel = new QueryableCollectionViewModel<TestItem>([...sampleData], 5);
  });

  afterEach(() => {
    viewModel.dispose();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should initialize with initial items and page size', () => {
    expect(viewModel.pageSize$.get()).toBe(5);
    const paginatedItems = viewModel.paginatedItems$.get();
    expect(paginatedItems.length).toBe(5);
    expect(paginatedItems[0].id).toBe(1);
    expect(viewModel.totalItems$.get()).toBe(sampleData.length);
    expect(viewModel.totalPages$.get()).toBe(Math.ceil(sampleData.length / 5));
  });

  describe('Pagination', () => {
    it('goToPage should change current page and update paginatedItems', () => {
      viewModel.goToPage(2);

      const paginatedItems = viewModel.paginatedItems$.get();
      expect(viewModel.currentPage$.get()).toBe(2);
      expect(paginatedItems.length).toBe(5);
      expect(paginatedItems[0].id).toBe(6);
    });

    it('nextPage should increment current page', () => {
      viewModel.nextPage();
      expect(viewModel.currentPage$.get()).toBe(2);
      expect(viewModel.paginatedItems$.get()[0].id).toBe(6);
    });

    it('prevPage should decrement current page', () => {
      viewModel.goToPage(2);
      expect(viewModel.paginatedItems$.get()[0].id).toBe(6);

      viewModel.prevPage();
      expect(viewModel.currentPage$.get()).toBe(1);
      const paginatedItems = viewModel.paginatedItems$.get();
      expect(paginatedItems.length).toBe(5);
      expect(paginatedItems[0].id).toBe(1);
    });

    it('nextPage should not go beyond totalPages (clamped view, page adjusts async)', async () => {
      const totalPages = viewModel.totalPages$.get();
      viewModel.goToPage(totalPages);
      viewModel.nextPage();

      // The paginated view clamps immediately
      const lastPageStart = (totalPages - 1) * 5;
      expect(viewModel.paginatedItems$.get()[0].id).toBe(sampleData[lastPageStart].id);

      // currentPage$ is written back on a microtask
      await advanceCollectionTimers(0);
      expect(viewModel.currentPage$.get()).toBe(totalPages);
    });

    it('prevPage should not go below 1', () => {
      viewModel.prevPage();
      expect(viewModel.currentPage$.get()).toBe(1);
    });

    it('setPageSize should update pageSize and recalculate totalPages and paginatedItems', () => {
      viewModel.setPageSize(3);
      expect(viewModel.pageSize$.get()).toBe(3);
      expect(viewModel.totalPages$.get()).toBe(Math.ceil(sampleData.length / 3));
      const paginatedItems = viewModel.paginatedItems$.get();
      expect(paginatedItems.length).toBe(3);
      expect(paginatedItems[0].id).toBe(1);
    });

    it('should adjust current page if it becomes out of bounds after page size change', async () => {
      viewModel.goToPage(3);
      expect(viewModel.currentPage$.get()).toBe(3);

      viewModel.setPageSize(10);
      viewModel.paginatedItems$.get(); // trigger recompute + clamp scheduling
      await advanceCollectionTimers(0);
      expect(viewModel.currentPage$.get()).toBe(2); // Should adjust to last possible page
    });
  });

  describe('Filtering', () => {
    it('setFilter should filter items and update paginatedItems, totalItems, totalPages', async () => {
      viewModel.setFilter('Fruit');
      await advanceCollectionTimers(); // filter debounce (150ms)

      const paginatedItems = viewModel.paginatedItems$.get();
      const totalItems = viewModel.totalItems$.get();
      const totalPages = viewModel.totalPages$.get();
      const pageSize = viewModel.pageSize$.get();
      const expectedFruitCount = sampleData.filter(
        (item) =>
          item.category === 'Fruit' ||
          item.name.toLowerCase().includes('fruit') ||
          String(item.value).includes('fruit'),
      ).length;
      expect(totalItems).toBe(expectedFruitCount);
      expect(
        paginatedItems.every(
          (item) =>
            item.category === 'Fruit' ||
            item.name.toLowerCase().includes('fruit') ||
            String(item.value).toLowerCase().includes('fruit'),
        ),
      ).toBe(true);
      expect(totalPages).toBe(Math.ceil(expectedFruitCount / pageSize));
    });

    it('setFilter with empty string should show all items', async () => {
      viewModel.setFilter('Fruit');
      await advanceCollectionTimers();
      expect(viewModel.totalItems$.get()).not.toBe(sampleData.length);

      viewModel.setFilter('');
      await advanceCollectionTimers();
      expect(viewModel.totalItems$.get()).toBe(sampleData.length);
    });

    it('filtering should be case-insensitive', async () => {
      viewModel.setFilter('apple');
      await advanceCollectionTimers();
      const paginatedItems = viewModel.paginatedItems$.get();
      expect(paginatedItems.length).toBe(1);
      expect(paginatedItems[0].name).toBe('Apple');
    });

    it('filtering should reset to page 1 if current page becomes out of bounds', async () => {
      viewModel.goToPage(3);
      expect(viewModel.currentPage$.get()).toBe(3);

      viewModel.setFilter('Carrot');
      await advanceCollectionTimers();
      const paginatedItems = viewModel.paginatedItems$.get(); // triggers clamp scheduling
      await advanceCollectionTimers(0);
      expect(viewModel.currentPage$.get()).toBe(1);
      expect(paginatedItems.length).toBe(1);
      expect(paginatedItems[0].name).toBe('Carrot');
    });
  });

  describe('Sorting', () => {
    it('setSort should sort items by specified key and direction', () => {
      viewModel.setSort('name', 'asc');
      expect(viewModel.paginatedItems$.get()[0].name).toBe('Apple');

      viewModel.setSort('name', 'desc');
      expect(viewModel.paginatedItems$.get()[0].name).toBe('Lemon');
    });

    it('setSort should toggle direction if same key is provided without direction', () => {
      viewModel.setSort('value');
      expect(viewModel.sortDirection$.get()).toBe('asc');
      expect(viewModel.paginatedItems$.get()[0].value).toBe(5);

      viewModel.setSort('value');
      expect(viewModel.sortDirection$.get()).toBe('desc');
      expect(viewModel.paginatedItems$.get()[0].value).toBe(100);
    });

    it('setSort should default to asc for a new key', () => {
      viewModel.setSort('value', 'desc');
      expect(viewModel.sortDirection$.get()).toBe('desc');

      viewModel.setSort('name');
      expect(viewModel.sortBy$.get()).toBe('name');
      expect(viewModel.sortDirection$.get()).toBe('asc');
    });

    it('sorting should handle numeric values correctly', () => {
      viewModel.setSort('value', 'asc');
      expect(viewModel.paginatedItems$.get().map((p) => p.value)).toEqual([5, 8, 10, 12, 15]);

      viewModel.setSort('value', 'desc');
      expect(viewModel.paginatedItems$.get().map((p) => p.value)).toEqual([100, 50, 40, 30, 25]);
    });

    it('sorting should handle null or undefined values by placing them first in asc and last in desc', () => {
      const dataWithNulls: TestItem[] = [
        { id: 1, name: 'A', category: 'C1', value: 10, nullableProp: 'Z' },
        { id: 2, name: 'B', category: 'C1', value: 20, nullableProp: null },
        { id: 3, name: 'C', category: 'C2', value: 5, nullableProp: 'X' },
        { id: 4, name: 'D', category: 'C2', value: 50, nullableProp: undefined },
      ];
      const vmWithNulls = new QueryableCollectionViewModel<TestItem>(dataWithNulls, 4);

      vmWithNulls.setSort('nullableProp', 'asc');
      const asc = vmWithNulls.paginatedItems$.get().map((i) => i.nullableProp);
      // Nullish values sort first in asc (their relative order is unspecified)
      expect(asc.slice(0, 2)).toEqual(expect.arrayContaining([null, undefined]));
      expect(asc.slice(2)).toEqual(['X', 'Z']);

      vmWithNulls.setSort('nullableProp', 'desc');
      const desc = vmWithNulls.paginatedItems$.get().map((i) => i.nullableProp);
      expect(desc.slice(0, 2)).toEqual(['Z', 'X']);
      expect(desc.slice(2)).toEqual(expect.arrayContaining([null, undefined]));

      vmWithNulls.dispose();
    });
  });

  describe('Item Manipulation', () => {
    it('loadItems should replace all items and reset relevant states', () => {
      const newItems = [{ id: 100, name: 'New Item', category: 'New Cat', value: 1 }];
      viewModel.loadItems(newItems);
      expect(viewModel.totalItems$.get()).toBe(1);
      const paginatedItems = viewModel.paginatedItems$.get();
      expect(paginatedItems.length).toBe(1);
      expect(paginatedItems[0].id).toBe(100);
    });

    it('addItem should add an item to the collection', async () => {
      const newItem: TestItem = { id: 13, name: 'Mango', category: 'Fruit', value: 35 };
      const initialTotal = viewModel.totalItems$.get();
      viewModel.addItem(newItem);
      expect(viewModel.totalItems$.get()).toBe(initialTotal + 1);

      viewModel.setFilter('Mango');
      await advanceCollectionTimers();
      const filteredItems = viewModel.paginatedItems$.get();
      expect(filteredItems.length).toBe(1);
      expect(filteredItems[0].id).toBe(13);
    });

    it('removeItem should remove an item from the collection', async () => {
      const initialTotal = viewModel.totalItems$.get();
      viewModel.removeItem('id', 1);
      expect(viewModel.totalItems$.get()).toBe(initialTotal - 1);

      viewModel.setFilter('Apple');
      await advanceCollectionTimers();
      expect(viewModel.paginatedItems$.get().length).toBe(0);
    });

    it('updateItem should modify an existing item', async () => {
      viewModel.updateItem('id', 2, { name: 'Golden Banana', value: 25 });

      viewModel.setFilter('Golden Banana');
      await advanceCollectionTimers();

      const items = viewModel.paginatedItems$.get();
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Golden Banana');
      expect(items[0].value).toBe(25);
      expect(items[0].category).toBe('Fruit'); // Original category should persist
    });
  });

  it('dispose should detach the debounced filter from further updates', async () => {
    viewModel.setFilter('Fruit');
    await advanceCollectionTimers();
    const filteredTotal = viewModel.totalItems$.get();
    expect(filteredTotal).not.toBe(sampleData.length);

    viewModel.dispose();

    // After dispose, further filter input no longer reaches the processed pipeline
    viewModel.setFilter('');
    await advanceCollectionTimers();
    expect(viewModel.totalItems$.get()).toBe(filteredTotal);
  });

  it('should handle empty initial data', () => {
    const emptyVM = new QueryableCollectionViewModel<TestItem>([]);

    expect(emptyVM.totalItems$.get()).toBe(0);
    expect(emptyVM.totalPages$.get()).toBe(1); // Max(1, Ceil(0/X)) = 1
    expect(emptyVM.paginatedItems$.get().length).toBe(0);
    emptyVM.dispose();
  });

  it('should handle page size greater than total items', () => {
    viewModel.setPageSize(100);
    expect(viewModel.pageSize$.get()).toBe(100);
    expect(viewModel.totalPages$.get()).toBe(1);
    expect(viewModel.paginatedItems$.get().length).toBe(sampleData.length);
  });
});
