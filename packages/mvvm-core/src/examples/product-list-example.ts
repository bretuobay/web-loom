import { QueryableCollectionViewModel } from '../viewmodels/queryable-collection-view-model';
import { SimpleDIContainer, ServiceRegistry } from '../core/di-container';
import { Observable, Subscription } from 'rxjs';

// Augment ServiceRegistry for this example
declare module '../core/di-container' {
  interface ServiceRegistry {
    productCollectionVM: QueryableCollectionViewModel<Product>;
  }
}

// --- 1. Define Product Data Structure ---
interface Product {
  id: string;
  name: string;
  category: 'Electronics' | 'Books' | 'Clothing' | 'Home Goods';
  price: number;
  inStock: boolean;
  rating: number; // 1-5
}

const sampleProducts: Product[] = [
  { id: 'P101', name: 'Laptop Pro 15"', category: 'Electronics', price: 1200.99, inStock: true, rating: 5 },
  { id: 'P102', name: 'Wireless Mouse', category: 'Electronics', price: 25.50, inStock: true, rating: 4 },
  { id: 'P103', name: 'The Great Novel', category: 'Books', price: 15.00, inStock: false, rating: 5 },
  { id: 'P104', name: 'T-Shirt Basic', category: 'Clothing', price: 19.99, inStock: true, rating: 3 },
  { id: 'P105', name: 'Coffee Maker Deluxe', category: 'Home Goods', price: 79.00, inStock: true, rating: 4 },
  { id: 'P106', name: 'Advanced JavaScript', category: 'Books', price: 45.00, inStock: true, rating: 5 },
  { id: 'P107', name: 'Gaming Keyboard', category: 'Electronics', price: 120.00, inStock: false, rating: 4 },
  { id: 'P108', name: 'Winter Jacket', category: 'Clothing', price: 150.75, inStock: true, rating: 5 },
  { id: 'P109', name: 'Smart Thermostat', category: 'Home Goods', price: 99.99, inStock: true, rating: 3 },
  { id: 'P110', name: 'Learning TypeScript', category: 'Books', price: 39.99, inStock: true, rating: 4 },
  { id: 'P111', name: 'Bluetooth Headphones', category: 'Electronics', price: 89.90, inStock: true, rating: 5 },
  { id: 'P112', name: 'Running Shoes', category: 'Clothing', price: 75.00, inStock: false, rating: 4 },
  { id: 'P113', name: 'Desk Lamp LED', category: 'Home Goods', price: 32.00, inStock: true, rating: 3 },
  { id: 'P114', name: 'Classic Poetry', category: 'Books', price: 12.50, inStock: true, rating: 4 },
  { id: 'P115', name: 'Webcam HD', category: 'Electronics', price: 55.00, inStock: true, rating: 4 },
];

// --- 2. Setup DI Container ---
function setupDI() {
  // Register QueryableCollectionViewModel for Products
  // Typically, initial items might come from a service/API call
  SimpleDIContainer.register('productCollectionVM',
    () => new QueryableCollectionViewModel<Product>(sampleProducts, 5), // Initial page size 5
    { isSingleton: true } // Often a collection view model is a singleton for a given view
  );
}

// --- 3. Helper to display collection state ---
function displayProductState(vm: QueryableCollectionViewModel<Product>, title: string) {
  console.log(`\n--- ${title} ---`);
  console.log(`Page: ${vm.currentPage$.getValue()} / ${vm.totalPages$.getValue()}`);
  console.log(`Page Size: ${vm.pageSize$.getValue()}`);
  console.log(`Total Items (after filter): ${vm.totalItems$.getValue()}`);
  console.log(`Sort: ${vm.sortBy$.getValue() || 'N/A'} (${vm.sortDirection$.getValue()})`);
  console.log(`Filter: "${vm.filterBy$.getValue() || 'N/A'}"`);
  console.log('Items on current page:');
  vm.paginatedItems$.getValue().forEach(p => {
    console.log(`  - ID: ${p.id}, Name: ${p.name}, Price: $${p.price}, Rating: ${p.rating}, Category: ${p.category}`);
  });
}

// --- 4. Main Example Logic ---
export async function runProductListExample() {
  console.log('--- Running Product List Example ---');
  setupDI();

  const productsVM = SimpleDIContainer.resolve('productCollectionVM');

  // --- 5. Subscribe to Observables (Simulating UI Binding) ---
  // In a real UI, you'd bind these to table/list components, pagination controls, etc.
  const subscriptions: Subscription[] = [];

  subscriptions.push(productsVM.paginatedItems$.subscribe(items => {
    // console.log('[UI Update] Paginated Items:', items.map(i => i.name));
    // This would trigger a re-render of the product list in a UI
  }));
  subscriptions.push(productsVM.currentPage$.subscribe(page => {
    // console.log('[UI Update] Current Page:', page);
  }));
  subscriptions.push(productsVM.totalPages$.subscribe(pages => {
    // console.log('[UI Update] Total Pages:', pages);
  }));
  subscriptions.push(productsVM.totalItems$.subscribe(count => {
    // console.log('[UI Update] Total Filtered Items:', count);
  }));

  // Initial display
  displayProductState(productsVM, 'Initial State');

  // --- 6. Simulate User Interactions ---

  // Change page size
  console.log('\nACTION: Set Page Size to 3');
  productsVM.setPageSize(3);
  await new Promise(resolve => setTimeout(resolve, 50)); // Allow observables to propagate
  displayProductState(productsVM, 'Page Size Changed to 3');

  // Go to next page
  console.log('\nACTION: Go to Next Page');
  productsVM.nextPage();
  await new Promise(resolve => setTimeout(resolve, 50));
  displayProductState(productsVM, 'After Next Page');

  // Go to page 3
  console.log('\nACTION: Go to Page 3');
  productsVM.goToPage(3);
  await new Promise(resolve => setTimeout(resolve, 50));
  displayProductState(productsVM, 'After Go to Page 3');

  // Filter items
  console.log('\nACTION: Filter by "Book"');
  productsVM.setFilter('Book');
  await new Promise(resolve => setTimeout(resolve, 200)); // Allow filter debounce
  displayProductState(productsVM, 'Filtered by "Book"');
  // Note: Current page might adjust if it became out of bounds.

  // Sort items
  console.log('\nACTION: Sort by Price (Ascending)');
  productsVM.setSort('price', 'asc');
  await new Promise(resolve => setTimeout(resolve, 50));
  displayProductState(productsVM, 'Sorted by Price (ASC)');

  console.log('\nACTION: Sort by Price (Descending) - by toggling');
  productsVM.setSort('price'); // Toggle direction
  await new Promise(resolve => setTimeout(resolve, 50));
  displayProductState(productsVM, 'Sorted by Price (DESC)');

  console.log('\nACTION: Sort by Rating (Descending)');
  productsVM.setSort('rating', 'desc');
  await new Promise(resolve => setTimeout(resolve, 50));
  displayProductState(productsVM, 'Sorted by Rating (DESC), Filter: "Book"');

  // Clear filter
  console.log('\nACTION: Clear Filter');
  productsVM.setFilter('');
  await new Promise(resolve => setTimeout(resolve, 200)); // Allow filter debounce
  displayProductState(productsVM, 'Filter Cleared, Sort: Rating (DESC)');

  // Add a new item
  console.log('\nACTION: Add new product');
  const newProduct: Product = { id: 'P200', name: 'Super Tablet', category: 'Electronics', price: 399.00, inStock: true, rating: 5};
  productsVM.addItem(newProduct);
  await new Promise(resolve => setTimeout(resolve, 50));
  displayProductState(productsVM, 'After Adding "Super Tablet"');

  // Update an item
  console.log('\nACTION: Update "Laptop Pro 15" price');
  productsVM.updateItem('id', 'P101', { price: 1150.00 });
  await new Promise(resolve => setTimeout(resolve, 50));
  // To see the update, we might need to filter or sort to bring it into view, or change page.
  // Let's filter to see it:
  productsVM.setFilter('Laptop Pro');
  await new Promise(resolve => setTimeout(resolve, 200));
  displayProductState(productsVM, 'After Updating Laptop Price (Filtered)');
  productsVM.setFilter(''); // Clear filter again
  await new Promise(resolve => setTimeout(resolve, 200));


  // Remove an item
  console.log('\nACTION: Remove "Wireless Mouse" (P102)');
  productsVM.removeItem('id', 'P102');
  await new Promise(resolve => setTimeout(resolve, 50));
  displayProductState(productsVM, 'After Removing "Wireless Mouse"');


  // --- 7. Cleanup ---
  subscriptions.forEach(sub => sub.unsubscribe());
  productsVM.dispose(); // Important for BehaviorSubjects within the VM

  console.log('--- Product List Example Complete ---');
}

// To run this example:
if (require.main === module) {
    runProductListExample().catch(err => {
        console.error("Unhandled error in example execution:", err);
    });
}
