import { useEffect, useMemo } from 'react';
import { createCommandPalette } from '@web-loom/ui-patterns';
import type { NavigateFunction } from 'react-router-dom';
import { uiStore } from '../../infrastructure/store/ui-store';
import { useBehaviorState } from '../../hooks/useBehaviorState';
import { CatalogViewModel } from '../catalog/CatalogViewModel';
import { CartViewModel } from '../cart/CartViewModel';

export function useAppCommandPalette(
  catalogViewModel: CatalogViewModel,
  cartViewModel: CartViewModel,
  navigate: NavigateFunction,
) {
  const palette = useMemo(() => {
    return createCommandPalette({
      commands: [
        {
          id: 'reload-products',
          label: 'Reload Products',
          category: 'Catalog',
          keywords: ['refresh', 'catalog'],
          action: () => {
            void catalogViewModel.refreshCatalogCommand.execute();
          },
        },
        {
          id: 'toggle-theme',
          label: 'Toggle Theme',
          category: 'Appearance',
          keywords: ['dark', 'light'],
          action: () => {
            uiStore.actions.toggleTheme();
          },
        },
        {
          id: 'toggle-cart',
          label: 'Toggle Cart Drawer',
          category: 'Cart',
          keywords: ['basket', 'cart'],
          action: () => {
            uiStore.actions.toggleCart();
          },
        },
        {
          id: 'clear-cart',
          label: 'Clear Cart',
          category: 'Cart',
          keywords: ['reset', 'empty'],
          action: () => {
            void cartViewModel.clearCartCommand.execute();
          },
        },
        {
          id: 'go-checkout',
          label: 'Go to Checkout',
          category: 'Cart',
          keywords: ['pay', 'order'],
          action: () => {
            uiStore.actions.closeCart();
            navigate('/checkout');
          },
        },
      ],
      onOpen: () => {
        uiStore.actions.openPalette();
      },
      onClose: () => {
        uiStore.actions.closePalette();
      },
    });
  }, [catalogViewModel, cartViewModel, navigate]);

  const state = useBehaviorState(palette);

  useEffect(() => {
    return () => {
      palette.destroy();
    };
  }, [palette]);

  return {
    palette,
    state,
  };
}
