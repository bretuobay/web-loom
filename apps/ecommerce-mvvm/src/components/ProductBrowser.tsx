import { useEffect, useRef } from 'react';
import type { CatalogProductDto } from '../infrastructure/api/ports/ecommerce-api-port';
import { formatMoney } from '../utils/money';

interface ProductBrowserProps {
  products: CatalogProductDto[];
  totalProducts: number;
  selectedProduct: CatalogProductDto | null;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectProduct: (product: CatalogProductDto) => void;
  onAddToCart: (productId: string) => void;
  onRefresh: () => void;
}

export function ProductBrowser({
  products,
  totalProducts,
  selectedProduct,
  isLoading,
  searchQuery,
  onSearchChange,
  onSelectProduct,
  onAddToCart,
  onRefresh,
}: ProductBrowserProps) {
  const hasUserTypedRef = useRef(false);
  const autoClearedStaleSearchRef = useRef(false);

  useEffect(() => {
    if (autoClearedStaleSearchRef.current || hasUserTypedRef.current || isLoading) {
      return;
    }

    if (totalProducts > 0 && products.length === 0 && searchQuery.trim().length > 0) {
      autoClearedStaleSearchRef.current = true;
      onSearchChange('');
    }
  }, [isLoading, onSearchChange, products.length, searchQuery, totalProducts]);

  return (
    <section className="product-browser">
      <div className="browser-toolbar">
        <div>
          <h2>Storefront</h2>
          <p>Browse products, inspect details, and add items to the cart.</p>
        </div>
        <button className="ghost-btn" type="button" onClick={onRefresh}>
          Reload
        </button>
      </div>

      <label className="field-label" htmlFor="search-products">
        Search products
      </label>
      <input
        id="search-products"
        className="text-input"
        value={searchQuery}
        onChange={(event) => {
          hasUserTypedRef.current = true;
          onSearchChange(event.target.value);
        }}
        placeholder="Search by name, category, or description"
        autoComplete="off"
      />

      {isLoading && <p className="status-line">Refreshing products...</p>}

      <div className="browser-grid">
        <div className="product-list">
          {products.length === 0 ? (
            <div className="empty-card">
              {searchQuery.trim().length > 0 ? 'No products found for this search.' : 'No products available right now.'}
            </div>
          ) : (
            products.map((product) => {
              const isSelected = selectedProduct?.id === product.id;

              return (
                <article
                  key={product.id}
                  className={`product-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectProduct(product)}
                >
                  <img src={product.imageUrl} alt={product.name} loading="lazy" />
                  <div className="product-content">
                    <h3>{product.name}</h3>
                    <p className="product-category">{product.category}</p>
                    <p className="product-description">{product.description}</p>
                    <div className="product-row">
                      <strong>{formatMoney(product.priceCents)}</strong>
                      <span>{product.stock} in stock</span>
                    </div>
                    <button
                      className="brand-btn"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddToCart(product.id);
                      }}
                    >
                      Add to cart
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <aside className="product-detail">
          {selectedProduct ? (
            <>
              <h3>{selectedProduct.name}</h3>
              <img src={selectedProduct.imageUrl} alt={selectedProduct.name} loading="lazy" />
              <p>{selectedProduct.description}</p>
              <dl>
                <div>
                  <dt>Category</dt>
                  <dd>{selectedProduct.category}</dd>
                </div>
                <div>
                  <dt>Price</dt>
                  <dd>{formatMoney(selectedProduct.priceCents)}</dd>
                </div>
                <div>
                  <dt>Stock</dt>
                  <dd>{selectedProduct.stock}</dd>
                </div>
              </dl>
              <button className="brand-btn" type="button" onClick={() => onAddToCart(selectedProduct.id)}>
                Add selected item
              </button>
            </>
          ) : (
            <div className="empty-card">Pick a product to view more details.</div>
          )}
        </aside>
      </div>
    </section>
  );
}
