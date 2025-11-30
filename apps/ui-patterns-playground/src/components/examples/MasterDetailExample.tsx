import { useState, useEffect } from 'react';
import { createMasterDetail } from '@web-loom/ui-patterns';
import './examples.css';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  stock: number;
}

/**
 * Example component demonstrating the Master-Detail pattern
 * Shows a list of items with synchronized detail view
 */
export function MasterDetailExample() {
  const products: Product[] = [
    {
      id: '1',
      name: 'Laptop',
      category: 'Electronics',
      price: 999.99,
      description: 'High-performance laptop with 16GB RAM',
      stock: 15,
    },
    {
      id: '2',
      name: 'Wireless Mouse',
      category: 'Accessories',
      price: 29.99,
      description: 'Ergonomic wireless mouse with precision tracking',
      stock: 50,
    },
    {
      id: '3',
      name: 'Mechanical Keyboard',
      category: 'Accessories',
      price: 149.99,
      description: 'RGB mechanical keyboard with Cherry MX switches',
      stock: 25,
    },
    {
      id: '4',
      name: 'Monitor',
      category: 'Electronics',
      price: 399.99,
      description: '27-inch 4K monitor with HDR support',
      stock: 10,
    },
    {
      id: '5',
      name: 'USB-C Hub',
      category: 'Accessories',
      price: 49.99,
      description: '7-in-1 USB-C hub with HDMI and SD card reader',
      stock: 30,
    },
  ];

  const [masterDetail] = useState(() =>
    createMasterDetail<Product>({
      items: products,
      getId: (item) => item.id,
      onSelectionChange: (item) => {
        console.log('Selection changed:', item);
      },
    }),
  );

  const [state, setState] = useState(masterDetail.getState());

  useEffect(() => {
    const unsubscribe = masterDetail.subscribe(setState);
    return () => {
      unsubscribe();
      masterDetail.destroy();
    };
  }, [masterDetail]);

  return (
    <div className="example-container">
      <h2>Master-Detail Pattern Example</h2>
      <p>
        This example demonstrates the <code>createMasterDetail</code> pattern from @web-loom/ui-patterns.
      </p>

      <div className="master-detail-layout">
        <div className="master-panel">
          <h3>Products</h3>
          <div className="master-list">
            {state.items.map((product) => (
              <div
                key={product.id}
                className={`master-item ${state.selectedItem?.id === product.id ? 'selected' : ''}`}
                onClick={() => masterDetail.actions.selectItem(product)}
              >
                <div className="master-item-content">
                  <h4>{product.name}</h4>
                  <p className="category">{product.category}</p>
                  <p className="price">${product.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => masterDetail.actions.clearSelection()}
            className="btn btn-secondary"
            disabled={!state.selectedItem}
          >
            Clear Selection
          </button>
        </div>

        <div className="detail-panel">
          {state.selectedItem ? (
            <>
              <h3>Product Details</h3>
              <div className="detail-content">
                <div className="detail-header">
                  <h2>{state.selectedItem.name}</h2>
                  <span className="badge">{state.selectedItem.category}</span>
                </div>
                <div className="detail-body">
                  <p className="description">{state.selectedItem.description}</p>
                  <div className="detail-info">
                    <div className="info-item">
                      <label>Price:</label>
                      <span className="price-large">${state.selectedItem.price.toFixed(2)}</span>
                    </div>
                    <div className="info-item">
                      <label>Stock:</label>
                      <span
                        className={
                          state.selectedItem.stock > 20
                            ? 'stock-high'
                            : state.selectedItem.stock > 10
                              ? 'stock-medium'
                              : 'stock-low'
                        }
                      >
                        {state.selectedItem.stock} units
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Product ID:</label>
                      <span>{state.selectedItem.id}</span>
                    </div>
                  </div>
                </div>
                <div className="detail-actions">
                  <button className="btn btn-primary">Add to Cart</button>
                  <button className="btn btn-secondary">Add to Wishlist</button>
                </div>
              </div>
            </>
          ) : (
            <div className="detail-empty">
              <p>Select a product to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
