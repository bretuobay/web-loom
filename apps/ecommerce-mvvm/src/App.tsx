import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useKeyboardShortcuts } from '@web-loom/ui-core';
import type { IConfirmation } from '@web-loom/mvvm-patterns';
import { createEcommerceApi } from './infrastructure/api/create-ecommerce-api';
import { appBus } from './infrastructure/events/app-bus';
import { uiStore } from './infrastructure/store/ui-store';
import { initTheme } from './theme/init-theme';
import { useObservable } from './hooks/useObservable';
import { useSignalValue } from './hooks/useSignalValue';
import { useUIStore } from './hooks/useUIStore';
import { CatalogModel } from './features/catalog/CatalogModel';
import { CatalogViewModel } from './features/catalog/CatalogViewModel';
import { CartModel } from './features/cart/CartModel';
import { CartViewModel } from './features/cart/CartViewModel';
import { useAppCommandPalette } from './features/palette/useAppCommandPalette';
import { Header } from './components/Header';
import { ProductBrowser } from './components/ProductBrowser';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutPanel } from './components/CheckoutPanel';
import { CommandPaletteOverlay } from './components/CommandPaletteOverlay';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { ToastStack } from './components/ToastStack';

type PendingConfirmation = {
  context: IConfirmation;
  callback: (response: IConfirmation) => void;
};

type ToastMessage = {
  id: string;
  message: string;
};

function AppShell() {
  const navigate = useNavigate();

  const api = useMemo(() => createEcommerceApi(), []);
  const catalogModel = useMemo(() => new CatalogModel(api), [api]);
  const cartModel = useMemo(() => new CartModel(api), [api]);

  const catalogViewModel = useMemo(() => new CatalogViewModel(catalogModel), [catalogModel]);
  const cartViewModel = useMemo(() => new CartViewModel(cartModel), [cartModel]);

  const { palette, state: paletteState } = useAppCommandPalette(catalogViewModel, cartViewModel, navigate);
  const shortcuts = useKeyboardShortcuts({ scope: 'global' });

  const uiState = useUIStore((state) => state);

  const catalogProducts = useSignalValue(catalogViewModel.filteredProducts);
  const catalogTotalProducts = useSignalValue(catalogViewModel.totalProducts);
  const selectedProduct = useSignalValue(catalogViewModel.selectedProduct);
  const searchQuery = useSignalValue(catalogViewModel.searchQuery);
  const cart = useSignalValue(cartViewModel.cart);
  const cartCount = useSignalValue(cartViewModel.itemCount);

  const catalogLoading = useObservable(catalogViewModel.isLoading$, false);
  const catalogError = useObservable<unknown>(catalogViewModel.error$, null);

  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((message: string) => {
    const toast: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      message,
    };

    setToasts((prev) => [...prev, toast]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== toast.id));
    }, 3200);
  }, []);

  useEffect(() => {
    void initTheme();
  }, []);

  useEffect(() => {
    catalogViewModel.activate();
    cartViewModel.activate();

    return () => {
      catalogViewModel.deactivate();
      cartViewModel.deactivate();
      catalogViewModel.dispose();
      cartViewModel.dispose();
      catalogModel.dispose();
      cartModel.dispose();
    };
  }, [catalogModel, catalogViewModel, cartModel, cartViewModel]);

  useEffect(() => {
    const onCheckoutCompleted = (orderId: string, totalCents: number) => {
      uiStore.actions.closeCart();
      navigate('/');
      pushToast(`Checkout complete: ${orderId} (${(totalCents / 100).toFixed(2)} USD).`);
    };

    const onItemAdded = (_productId: string, quantity: number) => {
      pushToast(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart.`);
    };

    appBus.on('checkout:completed', onCheckoutCompleted);
    appBus.on('cart:item-added', onItemAdded);

    return () => {
      appBus.off('checkout:completed', onCheckoutCompleted);
      appBus.off('cart:item-added', onItemAdded);
    };
  }, [navigate, pushToast]);

  useEffect(() => {
    const notificationSubscription = cartViewModel.notifications.requested$.subscribe((event) => {
      pushToast(event.context.content);
      event.callback(event.context);
    });

    const clearCartSubscription = cartViewModel.confirmClearCart.requested$.subscribe((event) => {
      setPendingConfirmation({
        context: event.context,
        callback: event.callback,
      });
    });

    const checkoutSubscription = cartViewModel.confirmCheckout.requested$.subscribe((event) => {
      setPendingConfirmation({
        context: event.context,
        callback: event.callback,
      });
    });

    return () => {
      notificationSubscription.unsubscribe();
      clearCartSubscription.unsubscribe();
      checkoutSubscription.unsubscribe();
    };
  }, [cartViewModel, pushToast]);

  useEffect(() => {
    shortcuts.actions.registerShortcut({
      key: 'Ctrl+K',
      handler: () => {
        if (paletteState.isOpen) {
          palette.actions.close();
        } else {
          palette.actions.open();
        }
      },
      preventDefault: true,
      description: 'Toggle command palette',
    });

    shortcuts.actions.registerShortcut({
      key: 'Meta+K',
      handler: () => {
        if (paletteState.isOpen) {
          palette.actions.close();
        } else {
          palette.actions.open();
        }
      },
      preventDefault: true,
      description: 'Toggle command palette',
    });

    shortcuts.actions.registerShortcut({
      key: 'Escape',
      handler: () => {
        const state = uiStore.getState();
        if (state.paletteOpen) {
          palette.actions.close();
          return;
        }
        if (state.cartOpen) {
          uiStore.actions.closeCart();
        }
      },
      preventDefault: true,
      description: 'Close overlays',
    });

    return () => {
      shortcuts.actions.clearAllShortcuts();
    };
  }, [palette, paletteState.isOpen, shortcuts.actions]);

  return (
    <div className="app-shell">
      <Header
        cartCount={cartCount}
        theme={uiState.theme}
        onOpenCart={() => uiStore.actions.openCart()}
        onOpenPalette={() => palette.actions.open()}
        onToggleTheme={() => uiStore.actions.toggleTheme()}
      />

      {catalogError instanceof Error ? <p className="error-banner">{catalogError.message}</p> : null}

      <Routes>
        <Route
          path="/"
          element={
            <ProductBrowser
              products={catalogProducts}
              totalProducts={catalogTotalProducts}
              selectedProduct={selectedProduct}
              isLoading={catalogLoading}
              searchQuery={searchQuery}
              onSearchChange={(value) => catalogViewModel.setSearchQuery(value)}
              onSelectProduct={(product) => catalogViewModel.selectProduct(product)}
              onAddToCart={(productId) => {
                void cartViewModel.addToCartCommand.execute({ productId, quantity: 1 });
              }}
              onRefresh={() => {
                void catalogViewModel.refreshCatalogCommand.execute();
              }}
            />
          }
        />

        <Route
          path="/checkout"
          element={
            <CheckoutPanel
              cart={cart}
              checkoutForm={cartViewModel.checkoutForm}
              onSubmit={() => {
                void cartViewModel.checkoutCommand.execute(undefined);
              }}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <CartDrawer
        open={uiState.cartOpen}
        cart={cart}
        onClose={() => uiStore.actions.closeCart()}
        onUpdateQuantity={(productId, quantity) => {
          void cartViewModel.updateQuantityCommand.execute({ productId, quantity });
        }}
        onRemove={(productId) => {
          void cartViewModel.removeItemCommand.execute(productId);
        }}
        onClear={() => {
          void cartViewModel.clearCartCommand.execute();
        }}
        onCheckout={() => {
          uiStore.actions.closeCart();
          navigate('/checkout');
        }}
      />

      <CommandPaletteOverlay palette={palette} state={paletteState} />

      {pendingConfirmation ? (
        <ConfirmationDialog
          title={pendingConfirmation.context.title}
          message={pendingConfirmation.context.content}
          confirmText={pendingConfirmation.context.confirmText}
          cancelText={pendingConfirmation.context.cancelText}
          onCancel={() => {
            pendingConfirmation.callback({
              ...pendingConfirmation.context,
              confirmed: false,
            });
            setPendingConfirmation(null);
          }}
          onConfirm={() => {
            pendingConfirmation.callback({
              ...pendingConfirmation.context,
              confirmed: true,
            });
            setPendingConfirmation(null);
          }}
        />
      ) : null}

      <ToastStack toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
